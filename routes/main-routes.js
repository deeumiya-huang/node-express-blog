const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.locals.user = req.session.user;
    res.render("home");
})

module.exports = router;