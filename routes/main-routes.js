const express = require("express");
const router = express.Router();
const postDao = require("../db/post-dao.js");
const auth = require("../middleware/auth.js");

router.get("/", async (req, res) => {
    res.locals.user = req.session.user;
    let userId = null;
    if (req.session.user) {
        userId = req.session.user.id;
    }
    let posts = await postDao.retrieveAllPost();
    posts = await getPostsComments(posts, userId);
    res.locals.posts = posts;
    res.render("home");
})

router.get("/personalPage",auth.verifyAuthenticated, async (req, res) => {
    res.locals.user = req.session.user;
    const userId = req.session.user.id;
    let posts = await postDao.retrievePersonalPost(userId);
    posts = await getPostsComments(posts, userId);
    res.locals.posts = posts;
    res.render("home");
})

async function getPostsComments(posts, userId) {
    const promises = posts.map(async (post) => {
        post.isAuthor = String(post.author_id) === String(userId);
        post.comments = await postDao.retrieveComments(post.id, userId);
        return post;
    })
    return await Promise.all(promises);
}

router.post("/createComment", async (req, res) => {
    try {
        const {post_id, parent_id, content} = req.body;
        // for those comment under post directly, make it null rather than undefined and send to DB.
        const verifiedParentId = parent_id ? parent_id : null;
        const userId = req.session.user.id;
        const result = await postDao.createComment(post_id, userId, content, verifiedParentId);
        res.redirect(`/#post-${post_id}`);
    } catch (e) {
        console.error(e);
        res.redirect("/");
    }
})

router.post("/deletePost/:postId", auth.verifyAuthenticated , async (req, res) => {
    const postId = req.params.postId;
    const userId = req.session.user.id;
    try {
        const result = await postDao.deletePost(postId, userId);
        if (result.affectedRows !== 0) {
            res.redirect(`/`);
        } else {
            throw new Error(`Post not found or user ${userId} is not authorized to delete post ${postId}`);
        }

    } catch (error) {
        console.error("delete post fails", error);
        res.redirect(`/`);
    }
})

module.exports = router;