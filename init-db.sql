-- Database initialization: schema + demo data.
-- Run it with:  npm run init-db   (scripts/init-db.js picks the database from .env and executes this file)
-- WARNING: the DROP statements below delete all existing blog data.

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

-- ============================================================================
-- Demo data, so the site has something to show right after cloning.
-- Every demo account uses the password: demo1234   (bcrypt hashed, cost 10)
-- ============================================================================

INSERT INTO web_users (id, username, password_hash) VALUES
    (1, 'alice', '$2b$10$VZ2T7rbG3lSzuizckG8Inusj2x1m39ANnxKP5IDUlw2ztXf8E6rG6'),
    (2, 'ben',   '$2b$10$wuYg2dlAB6V4ueqGMz1.ee/lkwEJKfOvhnZLdh3GBcIj0/CpKX7ly'),
    (3, 'chloe', '$2b$10$HL7klTBLR2V474IpbW7BM.O0LfNb.Lxu1qhWsHbY/npfpdPeah0N6'),
    (4, 'dan',   '$2b$10$5dt.mKx59xOvazhTWwsGc.uo3crj.PO8EDqOSSzmKiirCYHULmXka'),
    (5, 'emma',  '$2b$10$EyBVcXUEN6jlpClLtKyVPuN.GsY5/tVzM/78gZFQgj/t120nPIlwq');

INSERT INTO web_user_profiles (user_id, forename, surname, bio, avatar) VALUES
    (1, 'Alice', 'Anderson', 'Sky photos and weekend walks.',            'avatar3.png'),
    (2, 'Ben',   'Brooks',   'Front-end dev, learning something new every week.', 'avatar2.png'),
    (3, 'Chloe', 'Chen',     'Cooking, eating, repeat.',                  'avatar4.png'),
    (4, 'Dan',   'Davies',   'Here for the food posts.',                  'avatar1.png'),
    (5, 'Emma',  'Evans',    'Runner and gadget collector.',              'avatar4.png');

-- img_name refers to files in public/assets/post-img and public/assets/post-thumbnail.
-- Only the demo-* images are kept in git; everything users upload later is ignored (see .gitignore).
INSERT INTO web_posts (id, author_id, category, title, content, img_name, post_at, likes) VALUES
    (1, 1, 'life', 'Beautiful Day',     '<p>The sky is so<strong> beautiful</strong> today!</p>', 'demo-sunset.jpg',     '2026-09-01 09:15:00', 3),
    (2, 1, 'mood', 'Holiday',           '<p>I have a week holiday from tomorrow! OvO</p>',        NULL,                  '2026-09-02 18:40:00', 4),
    (3, 2, 'tech', 'AI',                '<p>AI agent is so powerful and convenient!</p>',         NULL,                  '2026-09-03 11:05:00', 1),
    (4, 3, 'life', 'My lovely lunch',   '<p>Look what I have for lunch!!</p><p>Delicious!</p>',   NULL,                  '2026-09-04 12:30:00', 2),
    (5, 1, 'mood', 'SKY',               '<p>Another beautiful sky today!!</p>',                   'demo-sky.jpg',        '2026-09-05 17:55:00', 0),
    (6, 2, 'tech', 'React',             '<p>Learning <strong>react</strong> today!</p>',          NULL,                  '2026-09-06 20:10:00', 2),
    (7, 1, 'tech', 'Mobile & Wearable', '<p>Look what I made today!</p>',                         'demo-smartwatch.png', '2026-09-07 15:20:00', 1);

-- parent_id builds the comment tree: NULL = top level, otherwise the comment it replies to.
-- Post 2 and post 4 show all three levels (comment -> reply -> sub-reply).
INSERT INTO web_comments (id, post_id, commenter_id, content, parent_id, post_at) VALUES
    (1,  2, 2, 'Sounds great! What is your plan for the week?', NULL, '2026-09-02 19:00:00'),
    (2,  2, 3, 'Alice is planning to travel with me!!',         1,    '2026-09-02 19:20:00'),
    (3,  2, 4, 'ENVYYYYY',                                      2,    '2026-09-02 19:35:00'),
    (4,  2, 1, 'Want to come with us??',                        1,    '2026-09-02 19:50:00'),
    (5,  2, 3, 'I have TWO weeks holiday!!',                    NULL, '2026-09-02 20:05:00'),
    (6,  2, 1, 'That is so great!!',                            5,    '2026-09-02 20:15:00'),
    (7,  1, 3, 'I love this picture you take!',                 NULL, '2026-09-01 10:00:00'),
    (8,  1, 1, 'Thanks!',                                       7,    '2026-09-01 10:30:00'),
    (9,  4, 4, 'Looks amazing!! Who is the chef?',              NULL, '2026-09-04 13:00:00'),
    (10, 4, 3, 'Guess!',                                        9,    '2026-09-04 13:15:00'),
    (11, 4, 5, 'Tell me!',                                      10,   '2026-09-04 13:40:00'),
    (12, 4, 1, 'Cook for me next time! plz~~~',                 NULL, '2026-09-04 14:00:00'),
    (13, 3, 1, 'Teach me how to use it!',                       NULL, '2026-09-03 12:00:00'),
    (14, 5, 1, 'I really love sky~',                            NULL, '2026-09-05 18:30:00');

-- one row per (post, user): the composite primary key is what prevents double likes
INSERT INTO web_post_likes (post_id, user_id) VALUES
    (1, 1), (1, 3), (1, 4),
    (2, 1), (2, 2), (2, 3), (2, 4),
    (3, 2),
    (4, 3), (4, 4),
    (6, 1), (6, 3),
    (7, 5);
