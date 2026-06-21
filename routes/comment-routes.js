const express = require('express');
const router = express.Router();

const postDao = require("../db/post-dao.js");
const auth = require("../middleware/auth.js");

// Check user before every request in this router file. Because routers in this file can only be run when the user log in.
router.use(auth.verifyAuthenticated);

router.post("/deleteComment/:postId/:commentId", async (req, res) => {
    const { postId, commentId } = req.params;
    const userId = req.session.user.id;
    try {
        const result = await postDao.deleteComment(postId, commentId, userId);
        if (result.affectedRows !== 0) {
            console.log("Comment successfully delete");
            res.redirect(`/#post-${postId}`);
        } else {
            console.log("Delete failed: Unauthorized or ID not found");
            res.redirect(`/#post-${postId}?error=delete_failed`);
        }
    } catch (error) {
        console.log("Delete failed",error);
        res.redirect(`/#post-${postId}?error=delete_failed`);
    }
})

router.post("/createComment", async (req, res) => {
    try {
        const {post_id, parent_id, content} = req.body;
        // for those comment under post directly, make it null rather than undefined and send to DB.
        const verifiedParentId = parent_id ? parent_id : null;
        const userId = req.session.user.id;
        await postDao.createComment(post_id, userId, content, verifiedParentId);
        res.redirect(`/#post-${post_id}`);
    } catch (e) {
        console.error(e);
        res.redirect("/");
    }
})

router.post("/editComment/:postId/:commentId", async (req, res) => {
    try {
        const {postId, commentId} = req.params;
        const content = req.body.content;
        const userId = req.session.user.id;
        const result = await postDao.editComment(postId, commentId, content, userId);
        if (result.affectedRows !== 0) {
            console.log("Comment successfully edited");
            res.redirect(`/#post-${postId}`);
        } else {
            console.error("Comment edited failed");
            res.redirect(`/#post-${postId}?message=comment_edited_failed`);
        }
    } catch (e) {
        console.error(e);
        res.redirect(`/?message=comment_edited_failed`);
    }
})

module.exports = router;