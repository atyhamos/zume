const AppProcess = () => {
  const iceConfiguration = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
      {
        urls: "stun:stun1.l.google.com:19302",
      },
    ],
  }

  const setConnection = connectionId => {
    const connection = new RTCPeerConnection(iceConfiguration)
  }

  return {
    setNewConnection: async function (connectionId) {
      await setConnection(connectionId)
    },
  }
}

const app = (() => {
  const init = (uid, mid) => {
    const socket = io.connect()
    socket.on("connect", () => {
      if (socket.connected) {
        if (uid && mid) {
          socket.emit("userconnect", {
            displayName: uid,
            meetingId: mid,
          })
        }
      }
    })
    socket.on("inform_others_about_me", data => {
      addUser(data.userId, data.connectionId) // add this user to my own view
      AppProcess.setNewConnection(data.connectionId) // for WebRTC
    })
  }

  const addUser = (userId, connectionId) => {
    const newDivId = $("#otherTemplate").clone()
    newDivId.attr("id", connectionId).addClass("other")
    newDivId.find("h2").text(userId)
    newDivId.find("video").attr("id", `v_${connectionId}`)
    newDivId.find("audio").attr("id", `a_${connectionId}`)
    newDivId.show()
    $("#divUsers").append(newDivId)
    console.log("someone just joined")
  }

  return {
    _init: (uid, mid) => init(uid, mid),
  }
})()
