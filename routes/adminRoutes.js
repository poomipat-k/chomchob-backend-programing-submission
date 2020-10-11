const express = require("express");
const adminController = require("../controller/admin");
const auth = require("../middleware/check-auth");

const router = express.Router();

// Pass token which can get by login in authorization as a Bearer Token
// Request body must contains both sysbol(string) and price(must be able to convert to numeric and > 0)
router.post("/crypto", auth, adminController.addNewCurrency);

router.get("/crypto", auth, adminController.getAllCurrencyBalance);

module.exports = router;
