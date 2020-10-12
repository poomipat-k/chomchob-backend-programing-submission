"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const signupRouter = require("./routes/signup");
const adminRouter = require("./routes/adminRoutes");
const usersRouter = require("./routes/userRoutes");
const auth = require("./middleware/check-auth");

// Port to listen to
const port = process.env.PORT || 5000;
const app = express();
app.use(bodyParser.json());

// Add auth middle where to all admin and user APIs
app.use("/api/v1/admin", auth, adminRouter);
app.use("/api/v1/users", usersRouter);
app.use("/", signupRouter);

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
