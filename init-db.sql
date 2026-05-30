-- Your database initialisation SQL here
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
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL ,
    forename VARCHAR(255) DEFAULT NULL,
    surname VARCHAR(255) DEFAULT NULL ,
    bio TEXT DEFAULT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES web_users(id) ON DELETE CASCADE
);


