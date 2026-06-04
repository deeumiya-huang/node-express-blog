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

INSERT INTO web_comments (id, post_id, commenter_id, content, parent_id) VALUES
-- ==========================================================
-- Scenario 1: Post 1 - Perfect 3-tier structure (Level 1 -> Level 2 -> Level 3)
-- ==========================================================
-- Level 1: Root Comment (ID: 1)
(1, 1, 1, 'This post is awesome! Super useful.', NULL),

-- Level 2: Replies to Root Comment (ID: 2, 3)
(2, 1, 2, 'Agreed! Especially the analysis in the second half, it is spot on.', 1),
(3, 1, 3, 'Quick question, are there more detailed examples for the third point mentioned in the article?', 1),

-- Level 3: Replies to Replies (ID: 4, 5) -> Maximum 3 levels reached
(4, 1, 1, 'Yeah, I think the second half is the best part too!', 2),
(5, 1, 2, 'You can check the author''s GitHub, the sample code is attached there.', 3),


-- ==========================================================
-- Scenario 2: Post 2 - 2-tier interaction only
-- ==========================================================
-- Level 1: Root Comment (ID: 6)
(6, 2, 2, 'Did anyone else have trouble connecting to the server today?', NULL),

-- Level 2: Reply to Root Comment (ID: 7)
(7, 2, 3, 'Yes, I had to restart my router to get it working.', 6),


-- ==========================================================
-- Scenario 3: Post 3 - Root comments only, no replies (1-tier)
-- ==========================================================
(8, 3, 3, 'Bookmarking this to read closely later when I have time.', NULL),
(9, 3, 1, 'Great post, highly recommended!', NULL),


-- ==========================================================
-- Scenario 4: Post 4 - Testing multiple Level 3 replies from different users
-- ==========================================================
-- Level 1
(10, 4, 2, 'The assignment for this class is so hard... I''m about to break down.', NULL),
-- Level 2
(11, 4, 1, 'I know, right! It took me the entire weekend to figure it out.', 10),
-- Level 3 (Multiple users replying to the same Level 2 comment)
(12, 4, 2, 'Save me, pro! Can you give me a hint for question 3?', 11),
(13, 4, 3, 'I''m stuck on question 3 too, can anyone shed some light on this?', 11);


