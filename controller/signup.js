"use strict";

const HttpError = require("../models/http-error");
const pool = require("../mySQL");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const ADMIN_USERNAME = ["admin"];
const DEFAULT_ROLE = "user";
const ADMIN_ROLE = "admin";

// Hard code jwt secrey key for assignment only,
// Use another key saving in environment variable to store and keep it in confidential for production
const JWT_SECRET_KEY = "ChomChobTest";

const signup = async (req, res, next) => {
  // Get inputs from request body
  const { username, password } = req.body;

  try {
    // SQL query template searching user from input username
    let sql = "SELECT `username` FROM users WHERE username = ?";

    // Query to database with username input
    const [results, fields] = await pool.promise().query(sql, [username]);

    // If username already exist return error, else signup the user to database
    if (results.length > 0) {
      const error = new HttpError("User already exists", 422);
      return next(error);
    }
  } catch (e) {
    return res.status(400).json({
      error: e,
    });
  }

  let hashedPassword;
  // Hash raw password with bcrypt
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Could not create user, please try again", 500);
    return next(error);
  }

  // Determine user role by search if the username match ADMIN_USERNAME array then role is admin else user
  let role = DEFAULT_ROLE;
  for (let i = 0; i < ADMIN_USERNAME.length; i++) {
    if (username === ADMIN_USERNAME[i]) {
      role = ADMIN_ROLE;
      break;
    }
  }

  // Signup query
  let signupQuery =
    "INSERT INTO `users` (`id`, `username`, `password`, `role`) VALUES (?, ?, ?, ?)";
  const signupData = [null, username, hashedPassword, role];

  // Insert a new row in users_wallet table
  let addUserToUserWalletQuery =
    "INSERT INTO `user_wallet` (`user_id`) VALUES (?)";

  // This block of code need to insert a new user to user table and insert user_id to user_wallet table
  // Use sql transaction
  try {

    // Start transaction
    await pool.promise().query("START TRANSACTION;");

    // Signup
    const [results] = await pool.promise().query(signupQuery, signupData);
    const userId = results.insertId;
    // Add user_id to user_wallet table
    await pool.promise().query(addUserToUserWalletQuery, [userId]);

    // Signup success response
    res.json({ success: true, username, userId });
  } catch (e) {
    return res.status(400).json({
      error: e,
      success: false,
    });
  }

  await pool.promise().query("COMMIT;")
};

// Log user in by Json Web Token strategy
const login = async (req, res, next) => {
  // Get inputs from request body
  const { username, password } = req.body;
  let user;
  try {
    // SQL query template searching user from input username
    let sql = "SELECT * FROM users WHERE username = ?";

    // Query to database with username input
    const [results, fields] = await pool.promise().query(sql, [username]);

    // If username not found return error, else continue to check password of the user
    if (results.length === 0) {
      const error = new HttpError("User not found", 404);
      return next(error);
    }
    user = results[0];
  } catch (e) {
    return res.status(400).json({
      error: e,
    });
  }

  let passwordIsValid = false;

  // Check password match
  try {
    passwordIsValid = await bcrypt.compare(password, user.password);
  } catch (e) {
    // bcrypt error
    const error = new HttpError("Could not log you in, please try again.", 500);
    return next(error);
  }

  if (!passwordIsValid) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      403
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET_KEY, {
      expiresIn: "1d",
    });
  } catch (e) {
    const error = new HttpError(
      "Logging in failed (data not correct), please try again.",
      500
    );
    return next(error);
  }

  res.json({
    token,
  });
};

module.exports = {
  signup,
  login,
};
