"use strict";

const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");

// Same key that use when signup a user
// Hard code jwt secrey key for assignment only,
// Use another key saving in environment variable to store and keep it in confidential for production
const JWT_SECRET_KEY = "ChomChobTest";

// A middleware to check whether user is login
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; // Get the token in header "Authorization": 'Bearer Token"

    if (!token) {
      const error = new HttpError("Please login to proceed", 403);
      return next(error);
    }

    // Decode token using our secret key
    const decodedToken = jwt.verify(token, JWT_SECRET_KEY);

    // Save decoded information in request and go next()
    req.userData = {
      userId: decodedToken.userId,
      role: decodedToken.role,
    };
    next();
  } catch (e) {
    // Catch error when decode token failed
    const error = new HttpError("Please login to proceed", 403);
    return next(error);
  }
};

module.exports = auth;
