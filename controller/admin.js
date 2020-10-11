const HttpError = require("../models/http-error");
const pool = require("../mySQL");

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
  } catch {
    const error = new HttpError(
      "Could not add new cryptocurrency, please try again",
      500
    );
    return next(error);
  }

  // Symbol is valid and not already exist, add new crypto
  try {
    let sql =
      "INSERT INTO `crypto` (`id`, `symbol`, `price`, `balance`) VALUES (?, ?, ?, ?)";
    let values = [null, symbol, price, 0];
    await pool.promise().query(sql, values);
    res.json({ success: true, symbol, price });
  } catch (e) {
    const error = new HttpError(
      "Could not add new cryptocurrency, please try again",
      500
    );
    return next(error);
  }
};

const getAllCurrencyBalance = async (req, res, next) => {
  const userData = req.userData;
};

module.exports = {
  addNewCurrency,
  getAllCurrencyBalance,
};
