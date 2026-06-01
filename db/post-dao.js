const database = require('./db-connect.js');

async function createPost(post) {
    const db = await database;
    const result = await db.query(
        `INSERT INTO web_posts(author_id, category, title, content, img_name) values (?,?,?,?,?)`,
        [post.author_id, post.category, post.title, post.content, post.img_name]);
    return result;
}

module.exports = {
    createPost
};