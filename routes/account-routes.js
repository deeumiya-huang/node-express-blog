const express = require("express");
const router = express.Router();

router.get("/login", (req, res) => {
    res.locals.layout = "account";
    res.render("account/login");
})
router.get("/create", function (req, res) {
    res.locals.layout = "account";
    res.render("account/create");
})


module.exports = router;