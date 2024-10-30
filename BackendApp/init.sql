CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(200) NOT NULL,
    password VARCHAR(200) NOT NULL,
    username VARCHAR(50),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email_verification_link VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    birth_date TIMESTAMP,
    gender_id INT,
    fame INT,
    profile_picture_id INT,
    biography VARCHAR(250),
    profile_completed BOOLEAN DEFAULT FALSE,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    localisation VARCHAR(100),
    FOREIGN KEY (gender_id) REFERENCES gender(id),
    FOREIGN KEY (profile_picture_id) REFERENCES pictures(id)
);

CREATE TABLE liked (
    first_userid INT NOT NULL,
    second_userid INT NOT NULL,
    first_user_like_status BOOLEAN DEFAULT FALSE,
    second_user_like_status BOOLEAN DEFAULT FALSE,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (first_userid, second_userid),
    FOREIGN KEY (first_userid) REFERENCES users(id),
    FOREIGN KEY (second_userid) REFERENCES users(id)
);

CREATE TABLE blocked (
    from_userid INT NOT NULL,
    to_userid INT NOT NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (from_userid, to_userid),
    FOREIGN KEY (from_userid) REFERENCES users(id),
    FOREIGN KEY (to_userid) REFERENCES users(id)
);

CREATE TABLE users_tags (
    userid INT NOT NULL,
    tagid INT NOT NULL,
    PRIMARY KEY (userid, tagid),
    FOREIGN KEY (userid) REFERENCES users(id),
    FOREIGN KEY (tagid) REFERENCES tag(id)
);

CREATE TABLE tag (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE pictures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userid INT NOT NULL,
    picture_position INT UNIQUE,
    picture1 MEDIUMTEXT,
    picture2 MEDIUMTEXT,
    picture3 MEDIUMTEXT,
    picture4 MEDIUMTEXT,
    picture5 MEDIUMTEXT,
    FOREIGN KEY (userid) REFERENCES users(id)
);

CREATE TABLE gender (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE attracted_by (
    userid INT NOT NULL,
    genderid INT NOT NULL,
    FOREIGN KEY (userid) REFERENCES users(id),
    FOREIGN KEY (genderid) REFERENCES gender(id)
);

CREATE TABLE `match` (
    first_userid INT NOT NULL,
    second_userid INT NOT NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (first_userid, second_userid),
    FOREIGN KEY (first_userid) REFERENCES users(id),
    FOREIGN KEY (second_userid) REFERENCES users(id)
);

CREATE TABLE message (
    id INT AUTO_INCREMENT PRIMARY KEY,
    matchid INT NOT NULL,
    message_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    content VARCHAR(255),
    message_status_id INT NOT NULL DEFAULT 0,
    FOREIGN KEY (message_status_id) REFERENCES status(id),
    FOREIGN KEY (matchid) REFERENCES `match`(first_userid)
);

CREATE TABLE status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE notification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userid INT,
    content VARCHAR(255) NOT NULL,
    statusid INT NOT NULL,
    FOREIGN KEY (userid) REFERENCES users(id),
    FOREIGN KEY (statusid) REFERENCES status(id)
);

CREATE TABLE views (
    userid INT,
    userid_seen INT,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (userid, userid_seen),
    FOREIGN KEY (userid) REFERENCES users(id),
    FOREIGN KEY (userid_seen) REFERENCES users(id)
);

DELIMITER //

CREATE TRIGGER check_likes_for_match
AFTER UPDATE ON liked
FOR EACH ROW
BEGIN
    DECLARE first_username VARCHAR(50);
    DECLARE second_username VARCHAR(50);

    SELECT username INTO first_username FROM users WHERE id = NEW.first_userid;
    SELECT username INTO second_username FROM users WHERE id = NEW.second_userid;

    IF NEW.first_user_like_status = TRUE AND NEW.second_user_like_status = TRUE THEN
        INSERT INTO `match` (first_userid, second_userid, created_on)
        VALUES (NEW.first_userid, NEW.second_userid, NOW());

        INSERT INTO notification (userid, content, statusid)
        VALUES 
            (NEW.first_userid, CONCAT('It''s a match! Start chatting with ', second_username), 1),
            (NEW.second_userid, CONCAT('It''s a match! Start chatting with ', first_username), 1);
    END IF;
END//

CREATE TRIGGER enforce_alphabetical_order_on_update
BEFORE UPDATE ON liked
FOR EACH ROW
BEGIN
    IF NEW.first_userid > NEW.second_userid THEN
        SET @temp := NEW.first_userid;
        SET NEW.first_userid = NEW.second_userid;
        SET NEW.second_userid = @temp;
    END IF;
END//

CREATE TRIGGER notify_view
BEFORE INSERT ON views
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1 FROM views
        WHERE userid = NEW.userid AND userid_seen = NEW.userid_seen
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'View already exists';
    ELSE
        INSERT INTO notification (userid, content, statusid, created_on)
        VALUES (NEW.userid_seen, CONCAT('Your profile was viewed by ', NEW.userid), 2, NOW());
    END IF;
END//

DELIMITER ;
