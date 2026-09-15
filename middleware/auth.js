function verifyAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else if (req.accepts(["html", "json"]) === "json") {
        // fetch() calls that ask for JSON get a 401 instead of a redirect: fetch() would silently follow
        // the redirect and load the home page HTML, so the page couldn't tell the user wasn't logged in.
        res.status(401).json({ success: false, message: "Please log in first" });
    } else {
        res.redirect("/");
    }
}

module.exports = { verifyAuthenticated };
