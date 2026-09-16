const fs = require("fs");
const path = require("path");

const POST_IMG_DIR = path.join(__dirname, "..", "public", "assets", "post-img");
const POST_THUMBNAIL_DIR = path.join(__dirname, "..", "public", "assets", "post-thumbnail");

// Remove a post image and its thumbnail from disk. Does nothing if fileName is empty (null / undefined).
// Called whenever an image stops being used (post edited / deleted, account deleted),
// so old files don't stay on disk as orphans.
function deleteImage(fileName) {
    if (!fileName) return;
    // path.basename: only ever delete a file directly inside the image folders
    const safeName = path.basename(fileName);
    fs.rmSync(path.join(POST_IMG_DIR, safeName), { force: true });
    fs.rmSync(path.join(POST_THUMBNAIL_DIR, safeName), { force: true });
}

module.exports = { POST_IMG_DIR, POST_THUMBNAIL_DIR, deleteImage };
