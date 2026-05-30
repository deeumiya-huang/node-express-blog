const express = require("express");
const router = express.Router();

router.get("/login", (req, res) => {
    res.locals.layout = false;
    res.render("account/login");
})


module.exports = router;