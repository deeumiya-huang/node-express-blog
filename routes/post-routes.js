const express = require('express');
const router = express.Router();

const postDao = require("../db/post-dao.js");
const userDao = require("../db/users-dao.js");
const auth = require("../middleware/auth.js");

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs");
const multer = require("multer");
const sanitizeHtml = require('sanitize-html');
const sharp = require("sharp");
const path = require("path");

// Only these image types are accepted. The file extension comes from this map, never from the user's file name.
const ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
};
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const POST_IMG_DIR = path.join(__dirname, "..", "public", "assets", "post-img");
const POST_THUMBNAIL_DIR = path.join(__dirname, "..", "public", "assets", "post-thumbnail");

// multer stores uploads in the project-level temp/ folder first (git-ignored), then the route moves them into public/
const upload = multer({
    dest: path.join(__dirname, "..", "temp"),
    limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_IMAGE_TYPES[file.mimetype]) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} is not allowed`));
        }
    }
});

// Wrap multer so an invalid upload (too big / wrong type) returns 400 instead of Express's default 500 error page.
function uploadPostImage(req, res, next) {
    upload.single('postImage')(req, res, (err) => {
        if (err) {
            console.error("image upload rejected:", err.message);
            return res.status(400).send("Upload failed: only JPG, PNG or GIF images up to 5 MB are allowed.");
        }
        next();
    });
}

// Move the uploaded file into public/ under a random name, create its thumbnail, and return the new file name.
// Using a random name (instead of file's original name) prevents two problems:
//   1. two users uploading "photo.jpg" would overwrite each other's image
//   2. a crafted name like "../../app.js" could write files outside the image folder (path traversal)
async function saveUploadedImage(file) {
    const fileName = crypto.randomUUID() + ALLOWED_IMAGE_TYPES[file.mimetype];
    const imgPath = path.join(POST_IMG_DIR, fileName);
    const thumbnailPath = path.join(POST_THUMBNAIL_DIR, fileName);

    fs.renameSync(file.path, imgPath);
    try {
        // sharp also acts as a real content check: it throws if the file isn't actually a valid image
        await sharp(imgPath).resize(680).toFile(thumbnailPath);
    } catch (error) {
        fs.rmSync(imgPath, { force: true });
        throw error;
    }
    return fileName;
}

// Remove an image saved by saveUploadedImage (e.g. when the post update fails). Does nothing if fileName is empty.
function deleteImage(fileName) {
    if (!fileName) return;
    fs.rmSync(path.join(POST_IMG_DIR, fileName), { force: true });
    fs.rmSync(path.join(POST_THUMBNAIL_DIR, fileName), { force: true });
}

// Check user before every request in this router file. Because routers in this file can only be run when the user log in.
router.use(auth.verifyAuthenticated);

router.post('/createPost', uploadPostImage, async (req, res) => {
    try {
        const {category, title, content} = req.body;
        let imgName = null;
        if (req.file) {
            imgName = await saveUploadedImage(req.file);
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
            img_name: imgName,
        }

        const result = await postDao.createPost(post);
        if (result.affectedRows !== 0) {
            console.log("Post successfully created");
            res.redirect("/");
        } else {
            throw new Error("Post created failed");
        }
    } catch (error) {
        console.error("create post failed", error);
        res.status(500).send('Server Error');
    }
});

router.post("/editPost/:postId", uploadPostImage, async (req, res) => {
    const postId = req.params.postId;
    const { category, title, content } = req.body;
    const userId = req.session.user.id;
    let newImgName = undefined; // set default undefined, which means no need to update img.
    try {

        // check if any photo was uploaded.
        if (req.file) {
            newImgName = await saveUploadedImage(req.file); // record new image name.
        }

        const cleanContent = sanitizeHtml(content, {
            allowedTags: [ 'h1', 'h2', 'p', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'u' ],
            allowedAttributes: {}
        });

        // if no new image upload, newImgName remain undefined.
        const result = await postDao.editPost(postId, category, title, cleanContent, newImgName, userId);
        if (result.affectedRows !== 0) {
            console.log("Post successfully edit");
            res.redirect(`/#post-${postId}`);
        } else {
            // Nothing matched "id = postId AND author_id = userId": the post doesn't exist, or it belongs to someone else.
            // Reply 404 in both cases, so a user can't find out which post ids exist by trying other people's posts.
            deleteImage(newImgName); // the new image won't be used, so don't leave it on disk
            res.status(404).send('Post not found');
        }
    } catch (error) {
        console.error("edit post failed", error);
        deleteImage(newImgName);
        res.status(500).send('Post edit failed');
    }
})

router.post("/deletePost/:postId", async (req, res) => {
    const postId = req.params.postId;
    const userId = req.session.user.id;
    try {
        const result = await postDao.deletePost(postId, userId);
        if (result.affectedRows !== 0) {
            res.redirect(`/`);
        } else {
            throw new Error(`Post not found or user ${userId} is not authorized to delete post ${postId}`);
        }

    } catch (error) {
        console.error("delete post fails", error);
        res.redirect(`/`);
    }
})

router.get("/editProfile", async (req, res) => {
    res.locals.user = req.session.user;
    res.locals.isEdit = true;
    res.locals.layout = null;
    res.render("account/profile");
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

router.post("/deleteAccount", async (req, res) => {
    const userId = req.session.user.id;
    try {
        const result = await userDao.deleteUser(userId);
        if (result.affectedRows !== 0) {
            console.log("account delete successfully!")
            req.session.destroy();
            res.redirect("/?message=Account_deleted_successfully!");
        } else {
            res.redirect("/?message=Account_deleted_failed!");
        }
    } catch (error) {
        console.log(error);
        res.redirect("/?message=Account_deleted_failed!");
    }
})

router.post("/likePost/:postId", async (req, res) => {
    try {
        const userId = req.session.user.id;
        const postId = req.params.postId;
        const { isLikeAction } = req.body;
        const latestLikes = await postDao.toggleLike(postId, userId, isLikeAction);
        res.json({success: true, latestLikes: latestLikes});
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
})

module.exports = router;