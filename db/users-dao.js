const database = require("./db-connect.js");

async function findUserByUsername(username) {
    const db = await database;

    const user = await db.query(
        "select * from web_users where username = ?",
        [username]);

    return await user[0];
}

module.exports = {
    findUserByUsername,
};