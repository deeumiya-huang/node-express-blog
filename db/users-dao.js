const database = require("./db-connect.js");

async function findUserByUsername(username) {
    const db = await database;

    const user = await db.query(
        "select * from web_users where username = ?",
        [username]);

    return await user[0];
}

async function createUser(username, hashedPassword) {
    const db = await database;
    return await db.query(
        `insert into web_users (username, password_hash) values (?,?)`,
        [username, hashedPassword],);
}
module.exports = {
    findUserByUsername,
    createUser,
};