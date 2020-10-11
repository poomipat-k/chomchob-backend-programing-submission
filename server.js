const express = require("express");
const bodyParser = require("body-parser");
const signupRouter = require("./routes/signup");
const adminRouter = require("./routes/adminRoutes");

const pool = require("./mySQL");

// Port to listen to
const port = process.env.PORT || 5000;
const app = express();
app.use(bodyParser.json());

app.use("/getrows", (req, res) => {
  pool.query("SELECT * FROM users", (err, results) => {
    if (err) throw err;
    console.log(results);
    res.send(results);
  });
});

app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/users", signupRouter);

// Catch error passed from next() from all route above
app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

app.listen(port, () => {
  console.log("Server up on port: " + port);
});
