const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const postDao = require("../db/post-dao.js");
const userDao = require("../db/users-dao.js");
const { createAccessToken, verifyJwt, TOKEN_LIFETIME_SECONDS } = require("../middleware/jwt-auth.js");
const { cleanPostContent } = require("../utils/post-content.js");
const { deleteImage } = require("../utils/post-images.js");

// JSON REST API. Unlike the page routes (which handle HTML forms and redirect), every route here
// returns JSON and uses the HTTP method + status code to describe what happened.
//
//   POST   /api/auth/token   log in, get a JWT        200 / 400 / 401
//   GET    /api/posts        list posts               200
//   GET    /api/posts/:id    one post                 200 / 400 / 404
//   POST   /api/posts        create a post  (JWT)     201 / 400 / 401
//   PUT    /api/posts/:id    replace a post (JWT)     200 / 400 / 401 / 404
//   DELETE /api/posts/:id    delete a post  (JWT)     204 / 400 / 401 / 404

const CATEGORIES = ["mood", "life", "tech", "economy"]; // same options as the post form

// Convert a DB row into the shape the API returns (camelCase, no internal columns).
function toApiPost(row) {
    return {
        id: row.id,
        category: row.category,
        title: row.title,
        content: row.content,
        imageUrl: row.img_name ? `/public/assets/post-img/${row.img_name}` : null,
        likes: row.likes,
        createdAt: row.post_at,
        author: { id: row.author_id, username: row.username },
    };
}

// Returns the post id from the URL as a number, or null if it isn't a positive integer.
function parsePostId(req) {
    const id = Number(req.params.id);
    return Number.isInteger(id) && id > 0 ? id : null;
}

// Validate the body of POST / PUT. Returns an error message, or null if the body is valid.
// PUT replaces the whole post, so it requires the same fields as POST.
function validatePostBody(body) {
    const { category, title, content } = body || {};
    if (!CATEGORIES.includes(category)) return `category must be one of: ${CATEGORIES.join(", ")}`;
    if (typeof title !== "string" || title.trim() === "") return "title is required";
    if (title.length > 255) return "title must be at most 255 characters";
    if (typeof content !== "string" || cleanPostContent(content).trim() === "") return "content is required";
    return null;
}

// ---------- auth

// Accepts JSON or form data ({ username, password }), like OAuth2's password flow.
router.post("/auth/token", async (req, res, next) => {
    try {
        const { username, password } = req.body || {};
        if (!username || !password) {
            return res.status(400).json({ error: "username and password are required" });
        }
        const user = await userDao.retrieveUserByUsername(username);
        // same message for "no such user" and "wrong password", so the API doesn't reveal which usernames exist
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: "Invalid username or password" });
        }
        res.json({
            access_token: createAccessToken(user),
            token_type: "Bearer",
            expires_in: TOKEN_LIFETIME_SECONDS,
        });
    } catch (error) {
        next(error); // Passing error to next() skips remaining routes and triggers app.use("/api", api.handleApiError)
    }
});

// ---------- GET posts (reading is public, like the home page)

router.get("/posts", async (req, res, next) => {
    try {
        const posts = await postDao.retrieveAllPost(null);
        res.json(posts.map(toApiPost));
    } catch (error) {
        next(error);
    }
});

router.get("/posts/:id", async (req, res, next) => {
    try {
        const postId = parsePostId(req);
        if (!postId) return res.status(400).json({ error: "id must be a positive integer" });

        const post = await postDao.retrievePostById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });
        res.json(toApiPost(post));
    } catch (error) {
        next(error);
    }
});

// ----------POST/PUT/DELETE posts (writing needs a JWT authentication through middleware)

router.post("/posts", verifyJwt, async (req, res, next) => {
    try {
        const invalid = validatePostBody(req.body);
        if (invalid) return res.status(400).json({ error: invalid });

        const { category, title, content } = req.body;
        const result = await postDao.createPost({
            author_id: req.apiUser.id,
            category: category,
            title: title.trim(),
            content: cleanPostContent(content),
            img_name: null, // image upload is only supported through the web form
        });
        const newId = Number(result.insertId); // insertId is a BigInt, which JSON can't serialize

        const post = await postDao.retrievePostById(newId);
        // 201 Created + Location header pointing at the new resource
        res.status(201).location(`/api/posts/${newId}`).json(toApiPost(post));
    } catch (error) {
        next(error);
    }
});

router.put("/posts/:id", verifyJwt, async (req, res, next) => {
    try {
        const postId = parsePostId(req);
        if (!postId) return res.status(400).json({ error: "id must be a positive integer" });
        const invalid = validatePostBody(req.body);
        if (invalid) return res.status(400).json({ error: invalid });

        const { category, title, content } = req.body;
        // when editing post, if imgName is undefined, then keep the current image
        const result = await postDao.editPost(postId, category, title.trim(), cleanPostContent(content), undefined, req.apiUser.id);
        // 404 (not 403) for someone else's post, so the API doesn't reveal which post ids exist
        if (result.affectedRows === 0) return res.status(404).json({ error: "Post not found" });

        res.json(toApiPost(await postDao.retrievePostById(postId)));
    } catch (error) {
        next(error);
    }
});

router.delete("/posts/:id", verifyJwt, async (req, res, next) => {
    try {
        const postId = parsePostId(req);
        if (!postId) return res.status(400).json({ error: "id must be a positive integer" });

        const imgName = await postDao.retrievePostImageName(postId);
        const result = await postDao.deletePost(postId, req.apiUser.id);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Post not found" });
        deleteImage(imgName); // don't leave the deleted post's image on disk
        res.status(204).end(); // 204 No Content: deleted, nothing to return
    } catch (error) {
        next(error);
    }
});

// Any other /api path: JSON 404 instead of falling through to the page routes.
router.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

// Errors passed to next(error), plus invalid JSON bodies from express.json(): always answer in JSON.
// because it's default format for error handler in express, even the 4th parameter "next" is not used, we still have to keep it there.
function handleApiError(err, req, res, next) {
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ error: "Request body is not valid JSON" });
    }
    console.error("API error", err);
    res.status(500).json({ error: "Internal server error" });
}

module.exports = { router, handleApiError };
