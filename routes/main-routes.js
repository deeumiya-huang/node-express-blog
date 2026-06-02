const express = require("express");
const router = express.Router();
const postDao = require("../db/post-dao.js");

router.get("/", async (req, res) => {
    res.locals.user = req.session.user;

    const posts = await postDao.retrieveAllPost();
    res.locals.posts = posts;
    res.render("home");
})

// router.get("/sortPosts", async (req, res) => {
//     const sortMap = {
//         latest: "post_at",
//         category: "category",
//         username: "username",
//         title: "title"
//     };
//     const sqlSort = sortMap[req.query.sort] || "post_at";
//     const posts = await postDao.retrieveSortedPost(sqlSort);
//     res.json(posts);
// })

router.get("/getComments", async (req, res) => {
    const postId = req.query.postId;
    const comments = await postDao.retrieveComments(postId);
    res.json(comments);
})
module.exports = router;