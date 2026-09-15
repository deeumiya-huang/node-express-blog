const jwt = require("jsonwebtoken");
const userDao = require("../db/users-dao.js");

// Fail-fast security check: Prevent signing or verifying tokens with an missing/empty secret.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set. Add it to your .env file (see .env.sample).");
}
const TOKEN_LIFETIME_SECONDS = 60 * 60; // 1 hour

function createAccessToken(user) {
    // "sub" (subject) is the standard JWT claim for "who this token is about"; the spec requires a string.
    return jwt.sign({ username: user.username }, JWT_SECRET, {
        subject: String(user.id),
        expiresIn: TOKEN_LIFETIME_SECONDS,
        algorithm: "HS256",
    });
}

function sendUnauthorized(res, message) {
    // WWW-Authenticate tells the client which auth scheme this API expects (RFC 6750)
    res.set("WWW-Authenticate", "Bearer");
    res.status(401).json({ error: message });
}

// For the JSON API: read "Authorization: Bearer <token>", verify it, and put the user on req.apiUser.
// (The web pages keep using the session cookie, see middleware/auth.js.)
async function verifyJwt(req, res, next) {
    const header = req.get("Authorization") || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
        return sendUnauthorized(res, "Missing Bearer token");
    }

    let payload;
    try {
        // only accept HS256, so a token can't pick a different algorithm (e.g. "none") for itself
        payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    } catch (error) {
        // TokenExpiredError / JsonWebTokenError (bad signature, malformed token, ...)
        return sendUnauthorized(res, error.name === "TokenExpiredError" ? "Token expired" : "Invalid token");
    }

    try {
        // A JWT stays valid until it expires, even if the account was deleted in the meantime,
        // so check the user still exists before trusting it.
        const user = await userDao.retrieveSessionUser(Number(payload.sub));
        if (!user) {
            return sendUnauthorized(res, "User no longer exists");
        }
        req.apiUser = user;
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = { createAccessToken, verifyJwt, TOKEN_LIFETIME_SECONDS };
