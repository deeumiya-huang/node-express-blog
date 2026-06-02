const database = require('./db-connect.js');

async function createPost(post) {
    const db = await database;
    const result = await db.query(
        `INSERT INTO web_posts(author_id, category, title, content, img_name) values (?,?,?,?,?)`,
        [post.author_id, post.category, post.title, post.content, post.img_name]);
    return result;
}

async function retrieveAllPost() {
    const db = await database;
    const posts = await db.query(
        `SELECT p.*, u.username, pr.avatar
         FROM web_posts p
         INNER JOIN web_users u ON u.id = p.author_id
         INNER JOIN web_user_profiles pr ON u.id = pr.user_id
         ORDER BY p.post_at DESC;`,
    );
    return posts;
}


async function retrieveSortedPost(sortBy) {
    const db = await database;
    const posts = await db.query(
        `SELECT p.*, u.username, pr.avatar
         FROM web_posts p
         INNER JOIN web_users u ON u.id = p.author_id
         INNER JOIN web_user_profiles pr ON u.id = pr.user_id
         ORDER BY ${sortBy} DESC;`
    );
    return posts;
}

module.exports = {
    createPost,
    retrieveAllPost,
    retrieveSortedPost
};