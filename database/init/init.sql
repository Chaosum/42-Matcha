CREATE TABLE gender (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(200) NOT NULL,
    password BINARY(32) NOT NULL,
    salt VARCHAR(32) NOT NULL,
    username VARCHAR(50) NOT NULL,
    birth_date DATE NOT NULL,
    email_verification_link VARCHAR(255),
    email_verification_link_expiration DATETIME,
    forgotten_password_link VARCHAR(255),
    forgotten_password_link_expiration DATETIME,
    is_verified BOOLEAN DEFAULT FALSE,
    first_name VARCHAR(50) DEFAULT '',
    last_name VARCHAR(50) DEFAULT '',
    address VARCHAR (100),
    gender_id INT CHECK (gender_id BETWEEN 1 AND 2), -- 1 Male / 2 Female
    sexual_orientation INT CHECK (sexual_orientation BETWEEN 1 AND 3), -- 1 hetero / 2 homo / 3 bi
    coordinates POINT,
    biography VARCHAR(280) DEFAULT '',
    profile_status INT DEFAULT 0,
    profile_completion_percentage INT DEFAULT 0,    
    fame INT DEFAULT 1000,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_date TIMESTAMP DEFAULT NULL,
    last_time_online TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (gender_id) REFERENCES gender(id)
);

CREATE TABLE users_tags (
    user_id INT NOT NULL,
    tag_id INT NOT NULL,
    id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (tag_id) REFERENCES tags(id)
);

CREATE TABLE pictures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    position INT NOT NULL,
    image_url TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
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
    is_blocked BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (from_userid, to_userid),
    FOREIGN KEY (from_userid) REFERENCES users(id),
    FOREIGN KEY (to_userid) REFERENCES users(id)
);

CREATE TABLE `match` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_userid INT NOT NULL,
    second_userid INT NOT NULL,
    status BOOLEAN DEFAULT TRUE,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (first_userid) REFERENCES users(id),
    FOREIGN KEY (second_userid) REFERENCES users(id),
    UNIQUE (first_userid, second_userid)
);

CREATE TABLE message (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    content VARCHAR(255),
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (match_id) REFERENCES `match`(id)
);

CREATE TABLE notification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userid INT,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    content VARCHAR(255) NOT NULL,
    isRead BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (userid) REFERENCES users(id)
);

CREATE TABLE views (
    userid INT,
    userid_seen INT,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (userid, userid_seen),
    FOREIGN KEY (userid) REFERENCES users(id),
    FOREIGN KEY (userid_seen) REFERENCES users(id)
);

CREATE TABLE reports (
   userid INT,
   userid_reported INT,
   created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (userid, userid_reported),
   FOREIGN KEY (userid) REFERENCES users(id),
   FOREIGN KEY (userid_reported) REFERENCES users(id)
);

DELIMITER //

CREATE TRIGGER notification_on_like
AFTER INSERT ON liked
FOR EACH ROW 
BEGIN
    DECLARE first_username VARCHAR(50);
    DECLARE second_username VARCHAR(50);

    SELECT username INTO first_username FROM users WHERE id = NEW.first_userid;
    SELECT username INTO second_username FROM users WHERE id = NEW.second_userid;

    IF NEW.first_user_like_status = TRUE THEN
        SELECT blocked.is_blocked INTO @isBlocked FROM blocked
        WHERE (from_userid = NEW.second_userid AND to_userid = NEW.first_userid);

        IF @isBlocked IS NULL OR @isBlocked = FALSE THEN
            SELECT users.first_name, users.last_name INTO @firstName, @lastName  FROM users WHERE id = NEW.first_userid;
            INSERT INTO notification (userid, content)
            VALUES (NEW.second_userid, CONCAT(@firstName, ' ', @lastName, ' liked you!'));
        END IF;
    END IF;

    IF NEW.second_user_like_status = TRUE THEN
        SELECT blocked.is_blocked INTO @isBlocked FROM blocked
        WHERE (from_userid = NEW.first_userid AND to_userid = NEW.second_userid);

        IF @isBlocked IS NULL OR @isBlocked = FALSE THEN
            SELECT users.first_name, users.last_name INTO @firstName, @secondName  FROM users WHERE id = NEW.second_userid;
            INSERT INTO notification (userid, content)
            VALUES (NEW.first_userid, CONCAT(@firstName, ' ', @lastName, ' liked you!'));
        END IF;
    END IF;
END //

CREATE TRIGGER notification_on_like_update
    AFTER UPDATE ON liked
    FOR EACH ROW
BEGIN
    DECLARE first_username VARCHAR(50);
    DECLARE second_username VARCHAR(50);

    SELECT username INTO first_username FROM users WHERE id = NEW.first_userid;
    SELECT username INTO second_username FROM users WHERE id = NEW.second_userid;

    IF NEW.first_user_like_status != OLD.first_user_like_status AND NEW.first_user_like_status = TRUE THEN
        SELECT blocked.is_blocked INTO @isBlocked FROM blocked
        WHERE (from_userid = NEW.first_userid AND to_userid = NEW.second_userid);

        IF @isBlocked IS NULL OR @isBlocked = FALSE THEN
            SELECT users.first_name, users.last_name INTO @firstName, @lastName  FROM users WHERE id = NEW.first_userid;
            SET @nameFirstUser = CONCAT(@firstName, ' ', @lastName);
            INSERT INTO notification (userid, content)
                VALUES (NEW.second_userid, CONCAT(@nameFirstUser, ' liked you!'));
        END IF;   
    END IF;

    IF NEW.second_user_like_status != OLD.second_user_like_status AND NEW.second_user_like_status THEN
        SELECT blocked.is_blocked INTO @isBlocked FROM blocked
        WHERE (from_userid = NEW.second_userid AND to_userid = NEW.first_userid);

        IF @isBlocked IS NULL OR @isBlocked = FALSE THEN
            SELECT users.first_name, users.last_name INTO @secondFirstName, @secondLastName  FROM users WHERE id = NEW.second_userid;
            SET @nameSecondUser = CONCAT(@secondFirstName, ' ', @secondLastName);
            INSERT INTO notification (userid, content)
                VALUES (NEW.first_userid, CONCAT(@nameSecondUser, ' liked you!'));
        END IF;
    END IF;
END //

CREATE TRIGGER check_likes_for_match
AFTER UPDATE ON liked
FOR EACH ROW
BEGIN
    DECLARE first_username VARCHAR(50);
    DECLARE second_username VARCHAR(50);

    SELECT username INTO first_username FROM users WHERE id = NEW.first_userid;
    SELECT username INTO second_username FROM users WHERE id = NEW.second_userid;
    
    SELECT status INTO @match_status FROM `match` 
        WHERE (first_userid = NEW.first_userid AND second_userid = NEW.second_userid) OR 
              (first_userid = NEW.second_userid AND second_userid = NEW.first_userid);

    IF NEW.first_user_like_status = TRUE AND NEW.second_user_like_status = TRUE THEN
        IF @match_status IS NULL THEN
            INSERT INTO `match` (first_userid, second_userid, created_on)
            VALUES (NEW.first_userid, NEW.second_userid, NOW());
        ELSE
            UPDATE `match` SET status = TRUE WHERE 
                (first_userid = NEW.first_userid AND second_userid = NEW.second_userid) OR 
                (first_userid = NEW.second_userid AND second_userid = NEW.first_userid);
        END IF;
        
        SELECT users.first_name, users.last_name INTO @firstName, @lastName FROM users WHERE id = NEW.first_userid;
        SELECT users.first_name, users.last_name INTO @secondName, @secondLastName FROM users WHERE id = NEW.second_userid;
        SET @nameFirstUser = CONCAT(@firstName, ' ', @lastName);
        SET @nameSecondUser = CONCAT(@secondName, ' ', @secondLastName);
        
        INSERT INTO notification (userid, content)
        VALUES 
            (NEW.first_userid, CONCAT('It''s a match! Start chatting with ', @nameSecondUser)),
            (NEW.second_userid, CONCAT('It''s a match! Start chatting with ', @nameFirstUser));

        UPDATE users SET fame = fame + 5
            WHERE id = NEW.first_userid;
        UPDATE users SET fame = fame + 5
            WHERE id = NEW.second_userid;
        
    ELSEIF (NEW.first_user_like_status = FALSE OR NEW.second_user_like_status = FALSE) AND @match_status = true THEN
        UPDATE `match` SET status = FALSE 
            WHERE (first_userid = NEW.first_userid AND second_userid = NEW.second_userid) OR 
                  (first_userid = NEW.second_userid AND second_userid = NEW.first_userid);
        IF (NEW.first_user_like_status = TRUE) THEN
            INSERT INTO notification (userid, content)
            VALUES 
                (NEW.first_userid, CONCAT(@nameSecondUser, ' Unmatched you! :('));
            
            UPDATE users SET fame = fame - 5
                WHERE id = NEW.second_userid;
        ELSE
            INSERT INTO notification (userid, content)
            VALUES 
                (NEW.second_userid, CONCAT(@nameFirstUser, ' Unmatched you! :('));
            
            UPDATE users SET fame = fame - 5
                WHERE id = NEW.first_userid;
        END IF;
    END IF;
END //

CREATE TRIGGER enforce_alphabetical_order_on_update
BEFORE UPDATE ON liked
FOR EACH ROW
BEGIN
    IF NEW.first_userid > NEW.second_userid THEN
        SET @temp := NEW.first_userid;
        SET NEW.first_userid = NEW.second_userid;
        SET NEW.second_userid = @temp;
    END IF;
END //

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
        SELECT blocked.is_blocked INTO @isBlocked FROM blocked
        WHERE (from_userid = NEW.userid_seen AND to_userid = NEW.userid);

        IF @isBlocked IS NULL OR @isBlocked = FALSE THEN
            SELECT first_name, last_name FROM users WHERE id = NEW.userid INTO @firstName, @lastName;
            SET @name = CONCAT(@firstName, ' ', @lastName);
            INSERT INTO notification (userid, content)
            VALUES (NEW.userid_seen, CONCAT('Your profile was visited by ', @name));
        END IF;
    END IF;
END //

CREATE TRIGGER after_insert_blocked
AFTER INSERT ON blocked
FOR EACH ROW
BEGIN
    SELECT status INTO @status FROM `match`
    WHERE (first_userid = NEW.from_userid AND second_userid = NEW.to_userid) OR
        (first_userid = NEW.to_userid AND second_userid = NEW.from_userid);

    UPDATE liked SET first_user_like_status = FALSE
    WHERE (first_userid = NEW.from_userid AND second_userid = NEW.to_userid);

    UPDATE liked SET second_user_like_status = FALSE
    WHERE (first_userid = NEW.to_userid AND second_userid = NEW.from_userid);
    
    UPDATE users SET fame = fame - 10
        WHERE id = NEW.to_userid;
END //

CREATE TRIGGER after_update_blocked
AFTER UPDATE ON blocked
FOR EACH ROW
BEGIN
    SELECT status INTO @status FROM `match`
    WHERE (first_userid = NEW.from_userid AND second_userid = NEW.to_userid) OR
        (first_userid = NEW.to_userid AND second_userid = NEW.from_userid);

    IF @status = TRUE THEN
        UPDATE liked SET first_user_like_status = FALSE
        WHERE (first_userid = NEW.from_userid AND second_userid = NEW.to_userid);

        UPDATE liked SET second_user_like_status = FALSE
        WHERE (first_userid = NEW.to_userid AND second_userid = NEW.from_userid);

        UPDATE users SET fame = fame - 10
        WHERE id = NEW.to_userid;
    ELSE
        UPDATE users SET fame = fame + 10
        WHERE id = NEW.to_userid;
    END IF;
END //

DELIMITER ;
