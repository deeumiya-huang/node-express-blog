-- Your database initialisation SQL here
DROP TABLE IF EXISTS web_post_likes;
DROP TABLE IF EXISTS web_comments;
DROP TABLE IF EXISTS web_posts;
DROP TABLE IF EXISTS web_user_profiles;
DROP TABLE IF EXISTS web_users;

CREATE TABLE IF NOT EXISTS web_users (
    id INT NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL ,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT chk_username UNIQUE ( username )
);

CREATE TABLE IF NOT EXISTS web_user_profiles (
    user_id INT NOT NULL ,
    forename VARCHAR(255) DEFAULT NULL,
    surname VARCHAR(255) DEFAULT NULL ,
    bio TEXT DEFAULT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (user_id),
    FOREIGN KEY (user_id) REFERENCES web_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS web_posts (
    id INT NOT NULL AUTO_INCREMENT ,
    author_id INT NOT NULL ,
    category VARCHAR(50),
    title VARCHAR(255),
    content TEXT,
    img_name VARCHAR(255),
    post_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    likes INT UNSIGNED DEFAULT 0,
    comment INT UNSIGNED DEFAULT 0,
    PRIMARY KEY (id),
    FOREIGN KEY (author_id) REFERENCES web_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS web_comments (
    id INT NOT NULL AUTO_INCREMENT,
    post_id INT NOT NULL,
    commenter_id INT NOT NULL ,
    content TEXT NOT NULL ,
    parent_id INT DEFAULT NULL,
    post_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (post_id) REFERENCES web_posts(id) ON DELETE CASCADE ,
    FOREIGN KEY (commenter_id) REFERENCES web_users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES web_comments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS web_post_likes (
    post_id INT NOT NULL ,
    user_id INT NOT NULL ,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES web_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES web_users(id) ON DELETE CASCADE
);

