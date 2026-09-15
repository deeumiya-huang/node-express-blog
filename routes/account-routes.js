const express = require("express");
const router = express.Router();

const userDao = require("../db/users-dao.js");
const bcrypt = require('bcryptjs');

// check if user already login
router.use(function (req, res, next) {
    res.locals.user = req.session.user;
    next();
});

// if user already login, redirect to home page
router.get("/login", (req, res) => {
    if (req.session.user) {
        res.redirect("/");
    } else {
        res.locals.layout = "account";
        res.locals.failMessage = req.query.failMessage;
        res.locals.successMessage = req.query.successMessage;
        res.render("account/login");
    }
});

router.post("/login", async function (req, res) {
    const {username, password} = req.body;
    try {
        const user = await userDao.retrieveUserByUsername(username);
        if (!user) {
            res.redirect("/account/login?failMessage=Authentication failed!");
            return;
        }
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (isMatch) {
            // user regenerate session to prevent hacker get user's session id before they log in.
            req.session.regenerate(async (err) => {
                if (err) return res.redirect("/account/login?failMessage=Authentication failed!");
                try {
                    // store only id / username / profile, not the whole user row (which includes password_hash)
                    req.session.user = await userDao.retrieveSessionUser(user.id);
                    res.redirect("/");
                } catch (e) {
                    console.log("login error:", e);
                    res.status(500).send("Login error");
                }
            })
        } else {
            res.redirect("/account/login?failMessage=Authentication failed!");
        }
    } catch (e) {
        console.log("login error:", e);
        res.status(500).send("Login error");
    }
});

router.get("/logout", function (req, res) {
    if (req.session.user) {
        // delete req.session.user;
        req.session.destroy(function(err) {
            if(err) {
                console.error(err);
                return res.redirect("/?message=Logout failed");
            }
            res.redirect("/account/login?successMessage=Successfully logged out!");
        });
    } else {
        res.redirect("/account/login");
    }
});

router.get("/create", function (req, res) {
    res.locals.layout = "account";
    res.locals.failMessage = req.query.failMessage;
    res.locals.successMessage = req.query.successMessage;
    res.render("account/create");
})

// after creating new account, redirect user to create their profile
router.post("/create", async function (req, res) {

    try {
        const { username, password } = req.body;
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const userId = await userDao.createUser(username, hashedPassword);
        req.session.userId = userId; // for createProfile form to send data with same user id.
        res.redirect("/account/createProfile")
    } catch (e) {
        console.error("register new account failed.",e);
        res.redirect("/account/create?failMessage=Register failed!");
    }
})

router.get("/createProfile", function (req, res) {
    if (!req.session.userId) {
        return res.redirect("./create");
    }
    res.locals.layout = null;
    res.render("account/profile");
})

router.post("/createProfile", async function (req, res) {
    try {
        const userId = req.session.userId;
        const { forename, surname, bio, selected_avatar } = req.body;
        await userDao.createUserProfile(userId, forename, surname, bio, selected_avatar);

        delete req.session.userId;
        res.redirect("/account/login?successMessage=Register successfully!");
    } catch (e) {
        console.error("Save profile failed.", e);
        res.redirect("/account/createProfile?failMessage=Failed to save profile.");
    }
})

// let user check if the username already has been used
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
        console.error("can't connect to db", e);
        res.status(500).json({ error: "Internal Server Error" });
    }
})

module.exports = router;