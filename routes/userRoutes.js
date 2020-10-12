"use strict";

const express = require("express");
const userController = require("../controller/users");
const auth = require("../middleware/check-auth");

const router = express.Router();

router.patch("/transfer/:targetUserId", auth, userController.transferSameCurrency);

module.exports = router;
