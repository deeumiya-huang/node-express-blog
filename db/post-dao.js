const database = require('./db-connect.js');

async function createPost(post) {
    const db = await database;
    const result = await db.query(
        `INSERT INTO web_posts(author_id, category, title, content, img_name) values (?,?,?,?,?)`,
        [post.author_id, post.category, post.title, post.content, post.img_name]);
    return result;
}

async function retrieveAllPost(userId) {
    const db = await database;
    const posts = await db.query(
        `SELECT p.*, u.username, pr.avatar,
                IF(l.user_id IS NOT NULL, 1, 0) AS userHasLiked
         FROM web_posts p
         INNER JOIN web_users u ON u.id = p.author_id
         INNER JOIN web_user_profiles pr ON u.id = pr.user_id
         LEFT JOIN web_post_likes l ON p.id = l.post_id AND l.user_id = ?
         ORDER BY p.post_at DESC;`,
        [userId]
    );
    // if l.user_id = userId, which means we can find the data in web_post_likes table that the user like the post.
    // So l.user_id will not be null and return 1 as userHasLiked, vice versa.
    return posts;
}

async function retrievePersonalPost(userId) {
    const db = await database;
    const posts = await db.query(
        `SELECT p.*, u.username, pr.avatar, IF(l.user_id IS NOT NULL, 1, 0) AS userHasLiked
                 FROM web_posts p
                 INNER JOIN web_users u ON u.id = p.author_id
                 INNER JOIN web_user_profiles pr ON u.id = pr.user_id
                 LEFT JOIN web_post_likes l ON p.id = l.post_id AND l.user_id = ?
                 WHERE p.author_id = ?
                 ORDER BY p.post_at DESC;`,
        [userId, userId]
    );
    return posts;
}

async function retrieveComments(postId, userId) {
    const db = await database;
    const comments = await db.query(
        `SELECT * FROM web_comments WHERE post_id = ?`,
        [postId]
    )
    const authorId = await getPostAuthorId(postId);
    let isAuthor = String(userId) === String(authorId);

    const resultTree = await buildCommentTree(comments, userId, isAuthor);
    return resultTree;

}

async function buildCommentTree(flatList, userId, isAuthor) {
    const map = {};
    const tree = [];

    const promises = flatList.map(async (item) => {
        const author = await getAuthorInfo(item.commenter_id);

        map[item.id] = {
            id: item.id,
            author: author,
            content: item.content,
            post_at: item.post_at,
            permissions: {
                edit: item.commenter_id === userId,
                delete: isAuthor || item.commenter_id === userId,
                reply: true
            },
            comments: []
        };
    });

    await Promise.all(promises);

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

async function getPostAuthorId(postId) {
    const db = await database;
    const result = await db.query(
        `select author_id from web_posts where id = ?`,
        [postId]
    );
    return result[0] ? String(result[0].author_id) : null;

}

async function getAuthorInfo(authorId) {
    const db = await database;

    const profile = await db.query(
        `select u.username, p.avatar from web_users u INNER JOIN web_user_profiles p ON u.id = p.user_id where u.id = ?`,
        [authorId]);

    return profile[0];
}

async function createComment(postId, userId, content, parentId) {
    const db = await database;
    const result = await db.query(
        `insert into web_comments (post_id, commenter_id, content, parent_id) values (?,?,?,?)`,
        [postId, userId, content, parentId]
    );
    return result;
}

async function deletePost(postId, userId) {
    const db = await database;
    const result = await db.query(
        `DELETE FROM web_posts WHERE id = ? AND author_id = ?;`,
        [postId, userId]
    );
    return result;
}

async function editPost(postId, category, title, content, imgName, userId) {
    const db = await database;
    // if new imgName was passed, update the imgName field, otherwise skip it.
    if (imgName !== undefined) {
        const result = await db.query(
            `UPDATE web_posts 
             SET category = ?, title = ?, content = ?, img_name = ? 
             WHERE id = ? AND author_id = ?;`,
            [category, title, content, imgName, postId, userId]
        );
        return result;
    } else {
        const result = await db.query(
            `UPDATE web_posts 
             SET category = ?, title = ?, content = ? 
             WHERE id = ? AND author_id = ?;`,
            [category, title, content, postId, userId]
        );
        return result;
    }
}

async function deleteComment(postId, commentId, userId) {
    const db = await database;
    const result = await db.query(
        `DELETE c FROM web_comments c
            INNER JOIN web_posts p ON c.post_id = p.id
            WHERE c.id = ? 
            AND c.post_id = ? 
            AND (c.commenter_id = ? OR p.author_id = ?);`,
        [commentId, postId, userId, userId]
    );
    return result;
}

async function editComment(postId, commentId, content, userId) {
    const db = await database;
    const result = await db.query(
        `UPDATE web_comments 
             SET content = ? ,
                post_at = NOW()
             WHERE id = ? AND post_id = ? AND commenter_id = ?;`,
        [content, commentId, postId, userId]
    )
    return result;
}

async function toggleLike(postId, userId, isLikeAction) {
    const db = await database;
    if (isLikeAction) {
        // use IGNORE to prevent resend like
        await db.query(`INSERT IGNORE INTO web_post_likes (post_id, user_id) VALUES (?, ?);`, [postId, userId]);
    }  else {
        await db.query(`DELETE FROM web_post_likes WHERE post_id = ? AND user_id = ?;`, [postId, userId]);
    }
    // get the real like amount from DB
    await db.query(
        `UPDATE web_posts p
             JOIN (SELECT COUNT(*) AS total FROM web_post_likes WHERE post_id = ?) c
             SET p.likes = c.total
             WHERE p.id = ?;`,
        [postId, postId]
    );

    const [row] = await db.query(`SELECT likes FROM web_posts WHERE id = ?`, [postId]);
    return row ? row.likes : 0;
}

module.exports = {
    createPost,
    retrieveAllPost,
    retrieveComments,
    createComment,
    retrievePersonalPost,
    deletePost,
    editPost,
    deleteComment,
    editComment,
    toggleLike,
};