// Load a .env file if one exists
require('dotenv').config()

// Setup Express
const express = require("express");
const app = express();
// Listen port will be loaded from .env file, or use 3000
const port = process.env.EXPRESS_PORT || 3000;

// Setup Handlebars
const handlebars = require("express-handlebars");
app.engine("handlebars", handlebars.engine({
    defaultLayout: "main"
}));
app.set("view engine", "handlebars");

// Set up to read POSTed form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json({}));

// Setup cookie-parser
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// Setup express-session
const session = require("express-session");
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 900000
    }
}));

// Make the "public" folder available statically
const path = require("path");
app.use("/public", express.static(path.join(__dirname, "public")));

// Setup routes
const mainRouter = require("./routes/main-routes.js");
app.use(mainRouter);

const accountRouter = require("./routes/account-routes.js");
app.use("/account", accountRouter);

// JSON REST API (JWT auth). Must be mounted BEFORE postRouter: postRouter runs router.use(auth.verifyAuthenticated)
// for every request that reaches it, which would redirect API clients (no session cookie) to the home page.
const api = require("./routes/api-routes.js");
app.use("/api", api.router);

const postRouter = require("./routes/post-routes.js");
app.use(postRouter);

const commentRouter = require("./routes/comment-routes.js");
app.use(commentRouter);

// Error handler for /api (including invalid JSON bodies from express.json above): always reply in JSON
app.use("/api", api.handleApiError);

app.listen(port, function () {
    console.log(`Web final project listening on http://localhost:${port}/`);
});
