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

async function retrieveComments(postId, userId) {
    const db = await database;
    const comments = await db.query(
        `SELECT * FROM web_comments WHERE post_id = ?`,
        [postId]
    )
    const resultTree = buildCommentTree(comments, userId);
    console.log(JSON.stringify(resultTree, null, 2));
    return resultTree;

}

function buildCommentTree(flatList, userId) {
    const map = {};
    const tree = [];

    flatList.forEach(item => {
        map[item.id] = {
            id: item.id,
            content: item.content,
            post_at: item.post_at,
            permissions: {
                edit: item.commenter_id === userId,   // can only modify and delete personal comment
                delete: item.commenter_id === userId,
                reply: true // default true
            },
            comments: [] // sub-comments
        };
    });

    flatList.forEach(item => {
        const currentItem = map[item.id];

        if (item.parent_id !== null) {
            const parent = map[item.parent_id];
            if (parent) {
                parent.comments.push(currentItem);
            }
        } else {
            tree.push(currentItem);
        }
    });

    validateReplyPermission(tree, 1); // check from level one

    return tree;
}

// check level and make reply false for the third levels
function validateReplyPermission(nodes, currentLevel) {
    nodes.forEach(node => {
        if (currentLevel >= 3) {
            node.permissions.reply = false;
            node.comments = []; // clear all sub-comments in third level
        }

        if (node.comments.length > 0) {
            validateReplyPermission(node.comments, currentLevel + 1);
        }
    });
}

module.exports = {
    createPost,
    retrieveAllPost,
    retrieveSortedPost,
    retrieveComments
};