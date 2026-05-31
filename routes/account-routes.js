const express = require("express");
const router = express.Router();

const userDao = require("../db/users-dao.js");
const bcrypt = require('bcryptjs');
const {logger} = require("../public/client-js/Logger");

router.get("/login", (req, res) => {
    res.locals.layout = "account";
    res.locals.message = req.query.message;
    res.render("account/login");
})

router.post("/login", async function (req, res) {
    const {username, password} = req.body;
    try {
        const user = await userDb.getUser(username);
        if (!user) {
            res.redirect("/login?message=Authentication failed!");
        }
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (isMatch) {
            req.session.regenerate((err) => {
                if (err) return res.redirect("/login?message=Authentication failed!");
                req.session.user = user;
                res.cookie("client_name", user.name, {
                    maxAge: 900000,
                    httpOnly: false,
                    path: "/"
                })
                res.redirect("/");
            })
        } else {
            res.redirect("/login?message=Authentication failed!");
        }
    } catch (e) {
        console.log("login error:", e);
        res.status(500).send("Login interface error");
    }
});

router.get("/create", function (req, res) {
    res.locals.layout = "account";
    res.locals.message = req.query.message;
    res.render("account/create");
})

router.post("/create", async function (req, res) {

    try {
        const { username, password } = req.body;
        const saltRounds = 5;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await userDao.createUser(username, hashedPassword);
        res.redirect("./login?message=Register successfully!");
    } catch (e) {
        logger.error("register new account failed.",e);
        res.redirect("./create?message=Register failed!");
    }
})

router.get("/checkUser", async function (req, res) {
    const username = req.query.username;
    try {
        const user = await userDao.findUserByUsername(username);
        let hasUser = true;
        if (!user) {
         hasUser = false;
        }
        res.json({
            hasUser: hasUser
        })
    } catch (e) {
        logger.error("can't connect to db", e);
        res.status(500).json({ error: "Internal Server Error" });
    }
})


module.exports = router;