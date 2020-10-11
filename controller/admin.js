"use strict";

const HttpError = require("../models/http-error");
const pool = require("../mySQL");

//  Add a new currency to crypto table
// Params:
//  Pass token that get from login as Bearer token
//  pass symbol and price by request body
const addNewCurrency = async (req, res, next) => {
  const userData = req.userData;
  let { symbol, price } = req.body;

  // Only admin is able to use the api
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

  // Symbol is valid and available to be added,
  try {
    let sql =
      "INSERT INTO `crypto` (`id`, `symbol`, `price`, `balance`) VALUES (?, ?, ?, ?)";
    let values = [null, symbol, price, 0];

    // Start transaction
    await pool.promise().query("START TRANSACTION;");
    // Add a new cryptocurrency to crypto table
    await pool.promise().query(sql, values);
    // Add a new crypto symbol to a new column of user_wallet table
    await pool
      .promise()
      .query(
        "ALTER TABLE `user_wallet` ADD `?` FLOAT NOT NULL DEFAULT '0' AFTER `user_id`",
        [symbol]
      );

    // Commit changes
    await pool.promise().query("COMMIT;");

    res.status(201).json({ success: true, symbol, price });
  } catch (e) {
    const error = new HttpError(
      "Could not add new cryptocurrency, please try again!",
      500
    );

    return next(error);
  }
};

const getAllCurrencyBalance = async (req, res, next) => {
  const userData = req.userData;

  // Only admin is able to use the api
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

// API clarification:
// ChomChob requirement "Admin can manage exchange rate between cryptocurrency."
// From my understanding it is not a good idea to manipulate the exchange rate of any specific pair
// The price field which is the universal value of any cryptocurrency in crypto table should be update
// So the exchange rate of the currency and all other currency changes automatically ((updated priceA)/ priceB)

// Params:
//  Add a new currency to crypto table
//  Pass token that get from login as Bearer token
//  pass symbol and price by request body
const updateCurrencyPrice = async (req, res, next) => {
  const userData = req.userData;

  // Only admin is able to use the api
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

module.exports = {
  addNewCurrency,
  getAllCurrencyBalance,
  updateCurrencyPrice,
};
