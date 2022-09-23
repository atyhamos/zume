const socket = io("/")
const videoGrid = document.getElementById("meetingContainer")

const myPeer = new Peer(undefined, {
  host: "/",
  port: "3001",
})

const myVideoDiv = document.createElement("div")

const peers = {} // to manage disconnections
const idToName = {}

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then(stream => {
    addVideoStream(myVideoDiv, stream, displayName)
    myPeer.on("connection", con => {
      console.log("I established connection with ", con.peer)
      // Send messages
      con.on("open", () => {
        con.send({ hello: true, displayName }) // for people who just joined to advertise their displayName

        // Receive messages
        con.on("data", data => {
          if (data.hello) {
            idToName[con.peer] = data.displayName
          }
          console.log(`I received `, data)
        })
      })
      con.on("error", err => console.log(err))

      // set peer to listen to call
      myPeer.on("call", call => {
        peers[call.peer] = call // for people who just joined to know their peers

        call.answer(stream)
        const receivedVideoDiv = document.createElement("div")

        call.on("stream", receivedVideoStream => {
          // set call to receive video
          console.log(idToName[call.peer])
          addVideoStream(
            receivedVideoDiv,
            receivedVideoStream,
            idToName[call.peer]
          )
        })
      })
    })

    // defined in server.js
    socket.on("user-connected", userId => {
      connectToNewUser(userId, stream)
    })
  })

// defined in server.js
socket.on("user-disconnected", userId => {
  console.log(`${userId} disconnected`)
  if (peers[userId]) peers[userId].close()
})

myPeer.on("open", id => {
  console.log("joining room....")
  socket.emit("join-room", ROOM_ID, id)
})

const connectToNewUser = (userId, stream) => {
  const con = myPeer.connect(userId)
  con.on("open", () => {
    console.log("I established connection with ", con.peer)
    con.send({ hello: true, displayName }) // advertise self to new users
    con.on("data", data => {
      if (data.hello) {
        idToName[con.peer] = data.displayName
      }
      console.log("I received: ", data)
    })

    console.log("Calling new user, ", userId)
    const call = myPeer.call(userId, stream) // Calling user with userId and sending own stream
    const peerVideoDiv = document.createElement("div")

    call.on("stream", peerVideoStream => {
      // listen for peer's stream and add it to our view
      addVideoStream(peerVideoDiv, peerVideoStream, idToName[userId])
    })
    call.on("close", () => {
      // listen for when peer disconnects
      peerVideoDiv.remove()
    })
    peers[userId] = call
  })
}

const addVideoStream = (videoDiv, stream, name) => {
  console.log("adding video!")
  const video = document.createElement("video")
  video.srcObject = stream
  video.autoplay = true
  video.muted = true // muted to ownself, not to others

  video.addEventListener("loadedmetadeta", () => {
    video.play() // play video when loaded
  })
  videoDiv.innerHTML = `<h2 class='text-center'>${name}</h2>`
  videoDiv.append(video)
  videoGrid.append(videoDiv)
}
