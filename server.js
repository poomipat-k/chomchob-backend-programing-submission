const express = require("express");

const port = process.env.PORT || 5000;

const app = express();

app.get("/", (req, res, next) => {
  res.send("Hello world!");
});

app.listen(port, () => {
  console.log("Server up on port: " + port);
});
