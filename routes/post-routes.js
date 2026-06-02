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
const auth = require("../middleware/auth.js");

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

module.exports = router;