require("dotenv").config();
const express = require("express");
const path = require("path");
const Bot = require("./bot")

const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


wss.on("connection", function connection(ws) {
  console.log("WebSocket client connected");

  function sendMessage(message) {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error("Error sending message to WebSocket client:", error);
    }
  }

  ws.on("message", async function incoming(message) {
    const data = JSON.parse(message);
    
    if (data.type === "startBot") {
      const { vwAddress, privateKeys } = data.payload;
      await Bot(vwAddress, privateKeys, sendMessage);
    }
  });
});


app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.post("/api/bot", Bot);

app.get("*", async (req, res) => {
  res.status(404).send({ message: `${req.url} not found!` });
});

server.listen(PORT, () => {
  console.log("Server is running on PORT", PORT);
});
