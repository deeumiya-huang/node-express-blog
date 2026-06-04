const express = require('express');
const router = express.Router();

const fs = require("fs");
const sharp = require("sharp");
const path = require("path");
const multer = require("multer");
const upload = multer({
    dest: path.join(__dirname, "temp")
});
const sanitizeHtml = require('sanitize-html');
const postDao = require("../db/post-dao.js");
const userDao = require("../db/users-dao.js");
const auth = require("../middleware/auth.js");
const bcrypt = require("bcryptjs");

//check user before every request in this router file
router.use(auth.verifyAuthenticated);

//todo: check user before create post
router.post('/createPost', upload.single('postImage'), async (req, res) => {
    try {
        const {category, title, content} = req.body;
        let fileInfo = null;
        if (req.file) {
            fileInfo = req.file;
            // Move the image into the images folder
            const oldFileName = fileInfo.path;
            const newFileName = `./public/assets/post-img/${fileInfo.originalname}`;
            fs.renameSync(oldFileName, newFileName);

            await sharp(newFileName)
                .resize(680)
                .toFile(`./public/assets/post-thumbnail/${fileInfo.originalname}`)
        }

        const cleanContent = sanitizeHtml(content, {
            allowedTags: [ 'h1', 'h2', 'p', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'u' ],
            allowedAttributes: {} // doesn't allow any dirty attribute like <img onerror="...">
        });

        // store into db
        const post = {
            author_id: req.session.user.id,
            category: category,
            title: title,
            content: cleanContent,
            img_name: fileInfo?.originalname || null,
        }

        const result = await postDao.createPost(post);
        if (result.affectedRows !== 0) {
            console.log("Post successfully created");
            res.redirect("/"); //todo: redirect to personal page, so the post will show up at the top.
        } else {
            throw new Error("Post created failed");
        }
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// todo: haven't edit image yet
router.post("/editPost/:postId", upload.none(),async (req, res) => {
    const { postId ,category, title, content} = req.body;
    const userId = req.session.user.id;
    try {
        const result = await postDao.editPost(postId, category, title, content, userId);
        if (result.affectedRows !== 0) {
            console.log("Post successfully edit");
            res.redirect(`/#post-${postId}`);
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Post edit failed');
    }
})

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

router.post("/editComment/:postId/:commentId", async (req, res) => {
    const { postId, commentId } = req.params;
    const content = req.body.content;
    const userId = req.session.user.id;
    try {
        const result = await postDao.editComment(postId, commentId, content, userId);
        if (result.affectedRows !== 0) {
            console.log("Comment successfully edit");
            res.redirect(`/#post-${postId}`);
        } else {
            console.log("Edit Comment failed: Unauthorized or ID not found");
            res.redirect(`/#post-${postId}?error=edit_failed`);        }
    } catch (error) {
        console.log("Edit Comment failed",error);
        res.redirect(`/#post-${postId}?error=edit_comment_failed`);
    }
})

router.get("/editProfile", async (req, res) => {
    res.locals.user = req.session.user;
    res.locals.isEdit = true;
    res.locals.layout = null;
    res.render("account/create-profile");
})

router.post("/editProfile", async (req, res) => {
    try {
        const userId = req.session.user.id;
        const {username, password, forename, surname, bio, selected_avatar} = req.body;

        if (password === ""){
            await userDao.updateUsername(userId, username);
        } else {
            const saltRounds = 5;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            await userDao.updateCredential(userId, username, hashedPassword);
        }
        // session has to change after edit!
        req.session.user = await userDao.retrieveUserByUsername(username);

        await userDao.updateProfile(userId, forename, surname, bio, selected_avatar);
        req.session.user.profile = await userDao.retrieveProfileById(userId);
        res.redirect("/?success=profile_updated");
    } catch (e) {
        console.error(e);
        res.redirect("/?error=edit_profile_failed");
    }
})

module.exports = router;