"use strict";

const HttpError = require("../models/http-error");
const pool = require("../mySQL");

//  Add a new currency to crypto table
// Params:
//  Pass token that get from login as Bearer token
//  pass symbol and price by request body
// eg. { "symbol" : "ABC" , "price" : 12.5 }
const addNewCurrency = async (req, res, next) => {
  const userData = req.userData;
  let { symbol, price } = req.body;

  // Admin authorization check
  if (userData.role !== "admin") {
    const error = new HttpError("Unauthorized, for admin use only", 401);
    return next(error);
  }

  // Both symbol and price must be passed in request body
  if (!symbol || !price) {
    const error = new HttpError(
      "Symbol and price must be pass in request body",
      400
    );
    return next(error);
  }

  // return NaN if input price is not numeric
  price = Number(price);

  // Price is not numeric or price = 0, throw error
  if (!(price > 0)) {
    const error = new HttpError("Price must be numeric", 400);
    return next(error);
  }

  // Verify that the symbol is not already exist
  try {
    let sql = "SELECT * FROM crypto WHERE symbol = ?";
    const [results, fields] = await pool.promise().query(sql, [symbol]);
    // Found symbol in table throw error
    if (results.length > 0) {
      const error = new HttpError("Symbol already used", 400);
      return next(error);
    }
  } catch (e) {
    const error = new HttpError(
      "Could not add new cryptocurrency, please try again",
      500
    );
    return next(error);
  }

  // Symbol is valid and available to be added
  try {
    let sql = "INSERT INTO `crypto` (`id`, `symbol`, `price`) VALUES (?, ?, ?)";
    let values = [null, symbol, price];

    // Add a new cryptocurrency to crypto table
    await pool.promise().query(sql, values);
    res.status(201).json({ success: true, symbol, price });
  } catch (e) {
    console.log(e);
    const error = new HttpError(
      "Could not add new cryptocurrency, please try again!",
      500
    );

    return next(error);
  }
};

//  Add a new currency to crypto table
// API clarification:
// ChomChob requirement "Admin can manage exchange rate between cryptocurrency."
// From my understanding it is not a good idea to manipulate the exchange rate of any specific pair
// The price field which is the universal value of any cryptocurrency in crypto table should be update
// So the exchange rate of the currency and all other currency changes automatically ((updated priceA)/ priceB)

// Params:
//  Pass token that get from login as Bearer token
//  pass symbol and price by request body
const updateCurrencyPrice = async (req, res, next) => {
  const userData = req.userData;

  // Admin authorization check
  if (userData.role !== "admin") {
    const error = new HttpError("Unauthorized, for admin use only", 401);
    return next(error);
  }

  let { symbol, price } = req.body;

  // Both symbol and price must be passed in request body
  if (!symbol || !price) {
    const error = new HttpError(
      "Symbol and price must be pass in request body",
      400
    );
    return next(error);
  }

  // return NaN if input price is not numeric
  price = Number(price);

  // Price is not numeric or price = 0, throw error
  if (!(price > 0)) {
    const error = new HttpError("Price must be numeric", 400);
    return next(error);
  }

  let cryptoData;
  // Verify that the symbol exists
  try {
    let sql = "SELECT * FROM crypto WHERE symbol = ?";
    const [results, fields] = await pool.promise().query(sql, [symbol]);
    // Found symbol in table throw error
    if (results.length === 0) {
      const error = new HttpError("Currency symbol not found", 404);
      return next(error);
    }
    cryptoData = results[0];
  } catch {
    const error = new HttpError(
      "Could not update cryptocurrency price, please try again",
      500
    );
    return next(error);
  }

  // Update cryptocurrency with a new price
  try {
    let sql = "UPDATE `crypto` SET `price` = ? WHERE `crypto`.`id` = ?";
    let values = [price, cryptoData.id];
    await pool.promise().query(sql, values);

    // Update success response success status , its symbol and new price
    res.json({
      success: true,
      symbol,
      price,
    });
  } catch (e) {
    const error = new HttpError(
      "Could not update cryptocurrency price, please try again",
      500
    );
    return next(error);
  }
};

// Admin update user balance via route "/api/v1/admin/crypto/:targetUserId"
// Params:
// pass symbol and balance in request body
// eg. { "symbol" : "AAA", "balance" : 500 }
const updateUserBalanceByUserId = async (req, res, next) => {
  const userData = req.userData;
  // Admin authorization check
  if (userData.role !== "admin") {
    const error = new HttpError("Unauthorized, for admin use only", 401);
    return next(error);
  }

  let targetUserId = req.params.targetUserId;
  //  Find that user exists in users table
  try {
    const [
      results,
      fields,
    ] = await pool
      .promise()
      .query("SELECT `id`, `username` FROM users WHERE id = ?", [targetUserId]);
    if (results.length === 0) {
      const error = new HttpError("User not found", 404);
      return next(error);
    }
  } catch (e) {
    const error = new HttpError(
      "Can not update user balance, please try again",
      500
    );
    return next(error);
  }

  // To reach here means  targetUserId is valid

  // Validate symbol and balance input are valid
  let { symbol, balance } = req.body;

  // balance = NaN if input balance is not a number
  balance = Number(balance);
  if (!(balance >= 0)) {
    return next(new HttpError("Balance must be numeric and >= 0", 400));
  }

  if (!symbol || !(balance >= 0)) {
    return next(new HttpError("Must provide symbol and balance", 400));
  }

  let cryptoId;
  // Find Crypto id from input symbol and save id to cryptoId, throw error if crypto not exists
  try {
    let sql = "SELECT `id` FROM crypto WHERE symbol = ?";
    const [results, fields] = await pool.promise().query(sql, [symbol]);
    if (results.length === 0) {
      return next(new HttpError("Crypto symbol not exists", 404));
    }
    cryptoId = results[0].id;
  } catch (e) {
    const error = new HttpError(
      "Can not update user balance, please try again",
      500
    );
    return next(error);
  }

  // Query user_wallet table that match user_id = targetUserId and crypto_id = cryptoId
  let searchResults;
  try {
    let sql = "SELECT * FROM user_wallet WHERE user_id = ? AND crypto_id = ?";
    let values = [targetUserId, cryptoId];
    const [results, fields] = await pool.promise().query(sql, values);
    searchResults = results;
  } catch (e) {
    const error = new HttpError(
      "Can not update user balance, please try again",
      500
    );
    return next(error);
  }

  // Row not found means the user never owns this currency
  // Add a new row to user_wallet with this crypto_id
  if (searchResults.length === 0) {
    try {
      let sql =
        "INSERT INTO `user_wallet` (`id`, `user_id`, `crypto_id`, `balance`) VALUES (?, ?, ?, ?)";
      let values = [null, targetUserId, cryptoId, balance];
      await pool.promise().query(sql, values);
    } catch (e) {
      const error = new HttpError(
        "Can not update user balance, please try again",
        500
      );
      return next(error);
    }
  }

  // Matched, update the user balance to input balance
  else {
    try {
      let sql =
        "UPDATE `user_wallet` SET balance = ? WHERE user_id = ? AND crypto_id = ?";
      let values = [balance, targetUserId, cryptoId];
      await pool.promise().query(sql, values);
    } catch (e) {
      const error = new HttpError(
        "Can not update user balance, please try again",
        500
      );
      return next(error);
    }
  }

  res.json({
    success: true,
    targetUserId,
    cryptoId,
    symbol,
    balance,
  });
};

const getAllCurrencyBalance = async (req, res, next) => {
  const userData = req.userData;

  // Admin authorization check
  if (userData.role !== "admin") {
    const error = new HttpError("Unauthorized, for admin use only", 401);
    return next(error);
  }

  try {
    const [results, fields] = await pool
      .promise()
      .query("SELECT `symbol`, `price`, `balance` FROM `crypto`");
    res.json({ results });
  } catch (e) {
    const error = new HttpError(
      "Can not get list of crypto balance, please try again",
      500
    );
    return next(error);
  }
};

module.exports = {
  addNewCurrency,
  getAllCurrencyBalance,
  updateCurrencyPrice,
  updateUserBalanceByUserId,
};
