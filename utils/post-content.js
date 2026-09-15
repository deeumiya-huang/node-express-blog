const sanitizeHtml = require('sanitize-html');

// Post content comes from the Quill editor as HTML, so it is rendered with {{{ }}} (unescaped) on the home page.
// Keep only the tags Quill produces and strip every attribute, e.g. <img onerror="..."> or <p onclick="...">, to prevent XSS.
// Used by both the page routes (post-routes.js) and the JSON API (api-routes.js).
function cleanPostContent(content) {
    return sanitizeHtml(content, {
        allowedTags: [ 'h1', 'h2', 'p', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'u' ],
        allowedAttributes: {}
    });
}

module.exports = { cleanPostContent };
