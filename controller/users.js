"use strict";
const HttpError = require("../models/http-error");
const pool = require("../mySQL");

const TRANSFER_ERROR = new HttpError(
  "Could not transfer at the moment, please try again",
  500
);

const transferSameCurrency = async (req, res, next) => {
  // Get logged in user data from req.userData that passed from auth middleware
  const userData = req.userData;
  // Get targetUserId from input url parameter
  const targetUserId = req.params.targetUserId;

  // Query to verify that targetUserId exist in users table, throw error if targetUser not exists
  try {
    const [
      results,
      fields,
    ] = await pool
      .promise()
      .query("SELECT * FROM users WHERE users.id = ?", [targetUserId]);
    if (results.length === 0) {
      return next(new HttpError("Target user to transfer not exist", 404));
    }
  } catch (e) {
    return next(TRANSFER_ERROR);
  }

  // get transfer parameter from request body
  let { amountFrom, symbolFrom, symbolTo } = req.body;

  // Cast amountFrom to Number
  amountFrom = Number(amountFrom);

  // Validate amountFrom input to be numeric
  if (!(amountFrom > 0)) {
    const error = new HttpError("amountFrom must be numeric type", 400);
    return next(error);
  }

  // Ensure symbolFrom is provided
  if (!symbolFrom) {
    const error = new HttpError("symbolFrom must be provided", 400);
    return next(error);
  }

  // Validate symbolFrom and symbolTo input
  let symbolFromId, symbolToId;
  let exchangeRate;

  // symbolTo not provided or symbolFrom equals symbolTo
  // transfer to target user with symbolTo currency
  if (!symbolTo || symbolFrom === symbolTo) {
    symbolTo = symbolFrom;
    try {
      let sql = "SELECT * FROM `crypto` WHERE `symbol` = ?";
      const [results, fields] = await pool.promise().query(sql, [symbolFrom]);
      if (results.length === 0) {
        const error = new HttpError("symbolFrom not exists", 404);
        return next(error);
      }

      // Save symbol id
      symbolFromId = results[0].id;
      symbolToId = symbolFromId;
      exchangeRate = 1;
    } catch (e) {
      return next(TRANSFER_ERROR);
    }
  }
  // symbolTo provided and not equalts symbolFrom, need to calculate exchange rate
  else if (symbolTo && symbolTo !== symbolFrom) {
    try {
      let sql = "SELECT * FROM `crypto` WHERE `symbol` = ? OR `symbol` = ?";
      const [results, fields] = await pool
        .promise()
        .query(sql, [symbolFrom, symbolTo]);

      if (results.length !== 2) {
        const error = new HttpError(
          "Atleast one input symbol are not valid",
          400
        );
        return next(error);
      }
      symbolFromId =
        symbolFrom === results[0].symbol ? results[0].id : results[1].id;
      symbolToId =
        symbolTo === results[0].symbol ? results[0].id : results[1].id;

      // Calculate exchange rate
      exchangeRate =
        results[0].id === symbolFromId
          ? results[0].price / results[1].price
          : results[1].price / results[0].price;
    } catch (e) {
      return next(TRANSFER_ERROR);
    }
  }

  // To reach here means we got both symbolFromId and symbolToId and both are valid
  // Verify that input  origin user balance >= amountFrom
  let originBalance;
  try {
    let sql =
      "SELECT balance FROM user_wallet WHERE user_id = ? AND crypto_id = ?";
    let values = [userData.userId, symbolFromId];
    const [results, fields] = await pool.promise().query(sql, values);

    // user_id with crypto_id not exist in user_wallet table, which means origin user balance of that currency = 0;
    if (results.length === 0) {
      const error = new HttpError("Transfer amount exceed your balance!", 400);
      return next(error);
    }
    // AmountFrom exceed origin user currency balance
    else if (results[0].balance < amountFrom) {
      const error = new HttpError("Transfer amount exceed your balance!", 400);
      return next(error);
    }
    originBalance = results[0].balance;
  } catch (e) {
    return next(TRANSFER_ERROR);
  }

  // At this point, all input data is valid and origin user have enough balance
  try {
    let sql = "SELECT * FROM user_wallet WHERE user_id = ? AND crypto_id = ?";
    let values = [targetUserId, symbolToId];
    const [results, fields] = await pool.promise().query(sql, values);

    // Start transaction
    await pool.promise().query("START TRANSACTION");

    // targetUser do not own the currency at the moment, Insert new row into user_wallet table
    if (results.length === 0) {
      await pool
        .promise()
        .query(
          "INSERT INTO user_wallet (id, user_id, crypto_id, balance) VALUES (?, ?, ?, ?)",
          [null, targetUserId, symbolToId, amountFrom * exchangeRate]
        );
    }
    // targetUser own the currency with some balance, Increment the balance with amountFrom
    else {
      await pool
        .promise()
        .query(
          "UPDATE user_wallet SET balance = ? WHERE user_id = ? AND crypto_id = ?",
          [
            amountFrom * exchangeRate + results[0].balance,
            targetUserId,
            symbolToId,
          ]
        );
    }

    // Decrement balance of origin user with amountFrom
    await pool
      .promise()
      .query(
        "UPDATE user_wallet SET balance = ? WHERE user_id = ? AND crypto_id = ?",
        [originBalance - amountFrom, userData.userId, symbolFromId]
      );

    // Commit Change
    await pool.promise().query("COMMIT");
  } catch (e) {
    return next(TRANSFER_ERROR);
  }

  res.json({
    success: true,
  });
};

module.exports = {
  transferSameCurrency,
};
