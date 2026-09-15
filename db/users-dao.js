
const db = require("./db-connect.js");

async function createUser(username, hashedPassword) {
    const result = await db.query(
        `insert into web_users (username, password_hash) values (?,?)`,
        [username, hashedPassword],);
    return Number(result.insertId) ; // cast number because original id was BigInt, it will cause error when passing by session. //todo: why?
}

async function retrieveUserByUsername(username) {
    const user = await db.query(
        "select * from web_users where username = ?",
        [username]);

    return user[0];
}

async function createUserProfile(userId, forename, surname, bio, selected_avatar) {
    const result = await db.query(
        `insert into web_user_profiles (user_id, forename, surname, bio, avatar) values (?,?,?,?,?)`,
        [userId, forename, surname, bio, selected_avatar]);
    return result;
}

async function retrieveProfileById(userId) {
    const profile = await db.query(
        "select * from web_user_profiles where user_id = ?",
        [userId]);

    return profile[0];
}

// Build the object stored in req.session.user: only the fields the pages need.
// Never put password_hash in the session (least privilege: the session doesn't need it).
async function retrieveSessionUser(userId) {
    const users = await db.query(
        "select id, username from web_users where id = ?",
        [userId]);
    if (!users[0]) return undefined;

    const profile = await retrieveProfileById(userId);
    return { id: users[0].id, username: users[0].username, profile: profile };
}

async function updateCredential(userId, username, hashedPassword) {
    return await db.query(
        `UPDATE web_users SET username = ?, password_hash = ? WHERE id = ?;`,
        [username, hashedPassword, userId]
    );
}

async function updateUsername(userId, username) {
    return await db.query(
        `UPDATE web_users SET username = ? WHERE id = ?;`,
        [username, userId]
    );
}

async function updateProfile(userId, forename, surname, bio, avatar) {
    return await db.query(
        `UPDATE web_user_profiles SET forename = ?, surname = ?, bio = ?, avatar = ? WHERE user_id = ?;`,
        [forename, surname, bio, avatar, userId]
    );
}

async function deleteUser(userId) {
    return await db.query(
        `DELETE FROM web_users WHERE id = ?;`,
        [userId]
    );
}

module.exports = {
    createUser,
    retrieveUserByUsername,
    createUserProfile,
    retrieveProfileById,
    retrieveSessionUser,
    updateUsername,
    updateCredential,
    updateProfile,
    deleteUser
};