const mariadb = require("mariadb");

// A pool keeps several connections open and lends one to each query, so concurrent requests
// don't have to share (and wait on) a single connection, and a dropped connection gets replaced
// instead of breaking every query after it.
const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionLimit: 10
});

module.exports = pool;
