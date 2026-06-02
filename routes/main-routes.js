const express = require("express");
const router = express.Router();
const postDao = require("../db/post-dao.js");

router.get("/", async (req, res) => {
    res.locals.user = req.session.user;

    const posts = await postDao.retrieveAllPost();
    res.locals.posts = posts;
    console.log(posts);
    res.render("home");
})

module.exports = router;