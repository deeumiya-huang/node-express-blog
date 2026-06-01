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

// Setup our routes
const router = require("./routes/account-routes.js");
app.use("/account", router);

const mainRouter = require("./routes/main-routes.js");
app.use(mainRouter);

const postRouter = require("./routes/post-routes.js");
app.use(postRouter);

app.listen(port, function () {
    console.log(`Web final project listening on http://localhost:${port}/`);
});
