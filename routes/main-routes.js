const express = require("express");
const router = express.Router();
const postDao = require("../db/post-dao.js");

router.get("/", async (req, res) => {
    res.locals.user = req.session.user;

    let posts = await postDao.retrieveAllPost();
    posts = await getPostsComments(posts);
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

async function getPostsComments(posts) {
    const promises = posts.map(async (post) => {
        post.comments = await postDao.retrieveComments(post.id);
        return post;
    })
    return await Promise.all(promises);
}

module.exports = router;