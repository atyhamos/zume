const socket = io("/")
const videoGrid = document.getElementById("meetingContainer")

const myPeer = new Peer(undefined, {
  host: "/",
  port: "3001",
})

const myVideo = document.createElement("video")
myVideo.muted = true // mute video to ourselves, not to others

const peers = {} // to manage disconnections

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then(stream => {
    addVideoStream(myVideo, stream)

    myPeer.on("call", call => {
      // set peer to listen to call
      call.answer(stream)
      const receivedVideo = document.createElement("video")

      call.on("stream", receivedVideoStream => {
        // set call to receive video stream
        addVideoStream(receivedVideo, receivedVideoStream)
      })
    })

    // defined in server.js
    socket.on("user-connected", userId => connectToNewUser(userId, stream))
  })

// defined in server.js
socket.on("user-disconnected", userId => {
  if (peers[userId]) peers[userId].close()
})

myPeer.on("open", id => {
  socket.emit("join-room", ROOM_ID, id)
})

const connectToNewUser = (userId, stream) => {
  const call = myPeer.call(userId, stream) // Calling user with userId and sending own stream
  const peerVideo = document.createElement("video")

  call.on("stream", peerVideoStream => {
    // listen for peer's stream and add it to our view
    addVideoStream(peerVideo, peerVideoStream)
  })
  call.on("close", () => {
    // listen for when peer disconnects
    peerVideo.remove()
  })
  peers[userId] = call
}

const addVideoStream = (video, stream) => {
  video.srcObject = stream
  video.autoplay = true
  video.muted = true // muted to ownself, not to others

  video.addEventListener("loadedmetadeta", () => {
    video.play() // play video when loaded
  })
  videoGrid.append(video)
}
