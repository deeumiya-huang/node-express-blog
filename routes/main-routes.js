const express = require("express");
const router = express.Router();
const postDao = require("../db/post-dao.js");
const auth = require("../middleware/auth.js");

router.get("/", async (req, res) => {
    try {
        res.locals.user = req.session.user;
        res.locals.isHomePage = true; // highlights "Home" in the navbars
        let userId = null;
        if (req.session.user) {
            userId = req.session.user.id;
        }
        let posts = await postDao.retrieveAllPost(userId);
        posts = await getPostsComments(posts, userId);
        res.locals.posts = posts;
        res.render("home");
    } catch (error) {
        console.error("load home page failed", error);
        res.status(500).send("Server Error");
    }
})

router.get("/personalPage",auth.verifyAuthenticated, async (req, res) => {
    try {
        res.locals.user = req.session.user;
        res.locals.isPersonalPage = true; // highlights "Personal" in the navbars
        const userId = req.session.user.id;
        let posts = await postDao.retrievePersonalPost(userId);
        posts = await getPostsComments(posts, userId);
        res.locals.posts = posts;
        res.render("home");
    } catch (error) {
        console.error("load personal page failed", error);
        res.status(500).send("Server Error");
    }
})

async function getPostsComments(posts, userId) {
    // one query for the comments of every post, instead of one query per post
    const commentTrees = await postDao.retrieveCommentsByPosts(posts, userId);
    posts.forEach(post => {
        post.isAuthor = String(post.author_id) === String(userId);
        post.comments = commentTrees.get(post.id);
        post.commentCount = countComments(post.comments);
    });
    return posts;
}

// Count every comment in a comment tree, replies included.
// Counted from the loaded tree (instead of a stored counter column) so it always matches what is shown.
function countComments(comments) {
    return comments.reduce((total, comment) => total + 1 + countComments(comment.comments), 0);
}

module.exports = router;
