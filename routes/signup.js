"use strict";

const express = require("express");
const signupController = require("../controller/signup");

const router = express.Router();

router.post("/signup", signupController.signup);

router.post("/login", signupController.login);

module.exports = router;
