
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

async function retrieveProfileById(userId) {
    const db = await database;

    const profile = await db.query(
        "select * from web_user_profiles where user_id = ?",
        [userId]);

    return profile[0];
}

async function updateCredential(userId, username, hashedPassword) {
    const db = await database;
    return await db.query(
        `UPDATE web_users SET username = ?, password_hash = ? WHERE id = ?;`,
        [username, hashedPassword, userId]
    );
}

async function updateUsername(userId, username) {
    const db = await database;
    return await db.query(
        `UPDATE web_users SET username = ? WHERE id = ?;`,
        [username, userId]
    );
}

async function updateProfile(userId, forename, surname, bio, avatar) {
    const db = await database;
    return await db.query(
        `UPDATE web_user_profiles SET forename = ?, surname = ?, bio = ?, avatar = ? WHERE user_id = ?;`,
        [forename, surname, bio, avatar, userId]
    );
}

async function deleteUser(userId) {
    const db = await database;
    return await db.query(
        `DELETE FROM web_users WHERE id = ?;`,
        [userId]
    );
}

module.exports = {
    findUserByUsername,
    createUser,
    retrieveUserByUsername,
    createUserProfile,
    retrieveProfileById,
    updateUsername,
    updateCredential,
    updateProfile,
    deleteUser
};