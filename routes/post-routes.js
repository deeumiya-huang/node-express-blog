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
//todo: check user before create post
router.post('/createPost', upload.single('postImage'), async (req, res) => {
    try {
        const {category, title, content} = req.body;
        if (req.file) {
            const fileInfo = req.file;
            // Move the image into the images folder
            const oldFileName = fileInfo.path;
            const newFileName = `./public/assets/post-img/${fileInfo.originalname}`;
            fs.renameSync(oldFileName, newFileName);

            await sharp(newFileName)
                .resize(680)
                .toFile(`./public/assets/post-thumbnail/${fileInfo.originalname}`)
        }

        const cleanContent = sanitizeHtml(content, {
            allowedTags: [ 'h1', 'h2', 'p', 'strong', 'em', 'ul', 'ol', 'li', 'br' ],
            allowedAttributes: {} // doesn't allow any dirty attribute like <img onerror="...">
        });
        console.log({ category, title, cleanContent });

        //todo: store into db
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;