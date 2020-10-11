const mysql = require("mysql2");

// Hard code username, password and database here is for ChomChob assignment purpose
// Better approch is to not expose these value by store these values in environment variable.
const pool = mysql.createPool({
  host: "remotemysql.com",
  user: "feOTJWm0Zu",
  password: "04pFTeJgBu",
  database: "feOTJWm0Zu",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
