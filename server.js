require("dotenv").config();
const express = require("express");
const path = require("path");
const Bot = require("./bot")
const PORT = process.env.PORT || 3000;

const app = express();

// app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.post("/api/bot", Bot);

app.get("*", async (req, res) => {
  res.status(404).send({ message: `${req.url} not found!` });
});

app.listen(PORT, () => {
  console.log("Server is running on PORT", PORT);
});
