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
    const result = await db.query(
        `insert into web_users (username, password_hash) values (?,?)`,
        [username, hashedPassword],);
    return Number(result.insertId) ; // cast number because original id was BigInt, it will cause error when passing by session. //todo: why?
}

async function retrieveUserByUsername(username) {
    const db = await database;

    const user = await db.query(
        "select * from web_users where username = ?",
        [username]);

    return user[0];
}

async function createUserProfile(userId, forename, surname, bio, selected_avatar) {
    const db = await database;
    const result = await db.query(
        `insert into web_user_profiles (user_id, forename, surname, bio, avatar) values (?,?,?,?,?)`,
        [userId, forename, surname, bio, selected_avatar]);
    return result;
}
module.exports = {
    findUserByUsername,
    createUser,
    retrieveUserByUsername,
    createUserProfile
};