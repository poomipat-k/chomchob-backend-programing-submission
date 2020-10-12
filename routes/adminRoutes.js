"use strict";

const express = require("express");
const adminController = require("../controller/admin");

const router = express.Router();

router.post("/crypto", adminController.addNewCurrency);

router.get("/crypto", adminController.getAllCurrencyBalance);

router.patch("/crypto", adminController.updateCurrencyPrice);

router.patch("/crypto/:targetUserId", adminController.updateUserBalanceByUserId)

module.exports = router;
