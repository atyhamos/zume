const express = require("express")
const path = require("path")
const PORT = 3000
const app = express()
const server = require("http").Server(app)
const { v4: uuidV4 } = require("uuid")

app.set("view engine", "ejs")
app.use(express.static(path.join(__dirname, ""))) // use root folder as static directory

app.get("/", (req, res) => {
  res.render("home")
})

app.get("/new", (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room })
})

server.listen(PORT)

const io = require("socket.io")(server, {
  allowEIO3: true,
})

io.on("connection", socket => {
  socket.on("join-room", (roomId, userId) => {
    // inform who joined the room
    socket.join(roomId)
    socket.to(roomId).emit("user-connected", userId)

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId) // inform who left the room
    })
  })
})
