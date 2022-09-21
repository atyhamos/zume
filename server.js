const express = require("express")
const path = require("path")
const PORT = 3000
const app = express()
const server = app.listen(PORT, () => {
  console.log(`Listening on Port ${PORT}`)
})

const io = require("socket.io")(server, {
  allowEIO3: true,
})
app.use(express.static(path.join(__dirname, ""))) // use root folder as static directory

const connections = []

io.on("connection", socket => {
  console.log(`socket id is ${socket.id}`)
  socket.on("userconnect", data => {
    console.log(data)
    const otherUsers = connections.filter(
      connection => connection.connectionId != socket.id
    )

    // add current user
    connections.push({
      connectionId: socket.id,
      userId: data.displayName,
      meetingId: data.meetingId,
    })

    otherUsers.forEach(v => {
      socket.to(v.connectionId).emit("inform_others_about_me", {
        connectionId: socket.id,
        userId: data.displayName,
      })
    })
  })
})
