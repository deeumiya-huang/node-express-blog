const db = require('./db-connect.js');

async function createPost(post) {
    const result = await db.query(
        `INSERT INTO web_posts(author_id, category, title, content, img_name) values (?,?,?,?,?)`,
        [post.author_id, post.category, post.title, post.content, post.img_name]);
    return result;
}

async function retrieveAllPost(userId) {
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

// Image file name of a post (null if it has no image, undefined if the post doesn't exist).
// Used to delete the old image files when a post's image is replaced/removed or the post is deleted.
async function retrievePostImageName(postId) {
    const rows = await db.query(`SELECT img_name FROM web_posts WHERE id = ?;`, [postId]);
    return rows[0]?.img_name;
}

// Image file names of all posts written by a user (used before deleting the account).
async function retrieveImageNamesByAuthor(userId) {
    const rows = await db.query(
        `SELECT img_name FROM web_posts WHERE author_id = ? AND img_name IS NOT NULL;`,
        [userId]
    );
    return rows.map(row => row.img_name);
}

// Returns one post (with the author's username and avatar), or undefined if it doesn't exist.
// Uses the same JOINs as retrieveAllPost, so a post is found here exactly when it appears in the list.
async function retrievePostById(postId) {
    const posts = await db.query(
        `SELECT p.*, u.username, pr.avatar
         FROM web_posts p
         INNER JOIN web_users u ON u.id = p.author_id
         INNER JOIN web_user_profiles pr ON u.id = pr.user_id
         WHERE p.id = ?;`,
        [postId]
    );
    return posts[0];
}

// Load the comments of all the given posts in ONE query, then build a comment tree for each post.
// Returns a Map of post id -> comment tree.
// (The old version ran 2 queries per post plus 1 query per comment to get the commenter's name and avatar,
//  so the home page needed 1 + posts × (2 + comments) queries. This is the classic "N+1 query" problem.)
async function retrieveCommentsByPosts(posts, userId) {
    const treesByPostId = new Map();
    if (posts.length === 0) return treesByPostId; // "IN ()" is invalid SQL

    // JOIN the commenter's username/avatar here instead of looking them up one comment at a time.
    // LEFT JOIN on profiles so a comment is still shown even if its author never created a profile.
    const comments = await db.query(
        `SELECT c.*, u.username, pr.avatar
         FROM web_comments c
         INNER JOIN web_users u ON u.id = c.commenter_id
         LEFT JOIN web_user_profiles pr ON pr.user_id = c.commenter_id
         WHERE c.post_id IN (?)
         ORDER BY c.id;`,
        [posts.map(post => post.id)]
    );

    // group the flat comment list by post
    const commentsByPostId = new Map();
    comments.forEach(comment => {
        if (!commentsByPostId.has(comment.post_id)) {
            commentsByPostId.set(comment.post_id, []);
        }
        commentsByPostId.get(comment.post_id).push(comment);
    });

    // the post author is already known from the posts query, so no extra query is needed for it
    posts.forEach(post => {
        const isAuthor = String(userId) === String(post.author_id);
        const postComments = commentsByPostId.get(post.id) || [];
        treesByPostId.set(post.id, buildCommentTree(postComments, userId, isAuthor));
    });
    return treesByPostId;
}

function buildCommentTree(flatList, userId, isAuthor) {
    const map = {};
    const tree = [];

    flatList.forEach(item => {
        map[item.id] = {
            id: item.id,
            author: { username: item.username, avatar: item.avatar },
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

async function createComment(postId, userId, content, parentId) {
    const result = await db.query(
        `insert into web_comments (post_id, commenter_id, content, parent_id) values (?,?,?,?)`,
        [postId, userId, content, parentId]
    );
    return result;
}

async function deletePost(postId, userId) {
    const result = await db.query(
        `DELETE FROM web_posts WHERE id = ? AND author_id = ?;`,
        [postId, userId]
    );
    return result;
}

async function editPost(postId, category, title, content, imgName, userId) {
    // imgName: undefined = keep the current image (skip the column), null = remove the image, a string = new image.
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
    retrieveCommentsByPosts,
    createComment,
    retrievePersonalPost,
    retrievePostById,
    retrievePostImageName,
    retrieveImageNamesByAuthor,
    deletePost,
    editPost,
    deleteComment,
    editComment,
    toggleLike,
};