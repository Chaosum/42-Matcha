DELIMITER //

# GetUserProfile
CREATE PROCEDURE GetUserProfile(IN username VARCHAR(50))
BEGIN   
    SELECT id INTO @userID FROM users WHERE users.username = username;
    
    SELECT id, email, first_name, last_name, birth_date, gender_id, sexual_orientation, biography,
           profile_completion_percentage, ST_AsText(coordinates) AS coordinates, fame, is_verified, profile_completion_percentage, 
           profile_status, users.address, users.username, last_time_online
    FROM users WHERE users.id = @userID;

    SELECT name, id FROM tags WHERE id IN (SELECT tag_id FROM users_tags WHERE user_id = @userID);
    SELECT image_url FROM pictures WHERE user_id = @userID ORDER BY position;
END //

CREATE PROCEDURE GetLikeAndMatch(
    IN userID INT,
    IN otherUser VARCHAR(50),
    OUT isLiked INT,
    OUT isBlocked INT,
    OUT isMatched INT
)
BEGIN 
    SELECT id INTO @otherUserID FROM users WHERE username = otherUser;

    SET isLiked = 0;
    
    IF userID < @otherUserID THEN
        SELECT first_user_like_status 
            INTO isLiked FROM liked 
            WHERE first_userid = userID AND second_userid = @otherUserID;
    ELSE
        SELECT second_user_like_status 
            INTO isLiked FROM liked 
            WHERE first_userid = @otherUserID AND second_userid = userID;
    END IF;
    
    SELECT is_blocked INTO isBlocked FROM blocked 
        WHERE from_userid = userID AND to_userid = @otherUserID;

    SELECT status INTO isMatched FROM `match` 
        WHERE (first_userid = userID AND second_userid = @otherUserID OR
                first_userid = @otherUserID AND second_userid = userID);
END //


CREATE PROCEDURE GetFullUserProfile(IN usernameInput VARCHAR(50))
BEGIN
    SELECT  u.id,
            u.username,
            u.first_name,
            u.last_name,
            u.gender_id,
            u.sexual_orientation,
            u.biography,
            ST_AsText(u.coordinates) AS coordinates,
            u.address,
            u.profile_completion_percentage,
            u.fame,
            u.is_verified,
            GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ',') AS tags,
            MAX(CASE WHEN p.position = 1 THEN p.image_url END) AS profile_picture,
            GROUP_CONCAT(
                CASE WHEN p.position != 1 THEN p.image_url END
                ORDER BY p.position SEPARATOR ','
            ) AS pictures,
            u.birth_date,
            u.profile_status
    FROM users u
    LEFT JOIN pictures p ON p.user_id = u.id
    LEFT JOIN users_tags ut ON ut.user_id = u.id
    LEFT JOIN tags t ON t.id = ut.tag_id
    WHERE u.username = usernameInput
    GROUP BY    u.id,
                u.first_name,
                u.last_name,
                u.birth_date,
                u.gender_id,
                u.sexual_orientation,
                u.biography,
                u.profile_completion_percentage,
                u.coordinates,
                u.fame,
                u.is_verified,
                u.profile_status,
                u.address,
                u.username;
END //


CREATE PROCEDURE GetUserProfileStatus(IN userID INT)
BEGIN
    SELECT profile_status
        FROM users WHERE id = userID;
END //

# UpdateUserProfile
CREATE PROCEDURE UpdateUserProfile(
    IN userID INT,
    IN firstName VARCHAR(50),
    IN lastName VARCHAR(50),
    IN genderID INT,
    IN sexualOrientation INT,
    IN Coordinates VARCHAR(50),
    IN Biography VARCHAR(250),
    IN Address VARCHAR(100)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;
    
    START TRANSACTION;

    UPDATE users SET users.first_name = firstName 
                 WHERE id = userID;
    
    UPDATE users SET users.last_name = lastName 
                 WHERE id = userID;
    
    UPDATE users SET users.gender_id = genderID 
                 WHERE id = userID;

    UPDATE users SET users.sexual_orientation = sexualOrientation 
                 WHERE id = userID;
     
    UPDATE users SET users.coordinates = POINT(
            CAST(SUBSTRING_INDEX(Coordinates, ',', 1) AS DECIMAL(10,6)),
            CAST(SUBSTRING_INDEX(Coordinates, ',', -1) AS DECIMAL(10,6))
         )
         WHERE id = userID;
    
    UPDATE users SET users.biography = Biography 
                 WHERE id = userID;
    
    UPDATE users SET users.address = Address 
                 WHERE id = userID;
    
    COMMIT;

    SELECT users.profile_status INTO @profile_status FROM users WHERE id = userID;
    IF @profile_status = 0 THEN
        UPDATE users SET profile_status = 1 WHERE id = userID;
    END IF;

    CALL UpdateProfileCompletionPercentage(userID);
END //

CREATE PROCEDURE UpdateProfileStatus(
    IN userID INT,
    IN status INT
)
BEGIN
    UPDATE users SET profile_status = status WHERE id = userID;
END //

# UpdateProfileCompletionPercentage
CREATE PROCEDURE UpdateProfileCompletionPercentage(IN userID INT)
BEGIN
    SELECT COUNT(*) INTO @tags_count FROM users_tags WHERE user_id = userID;
    SELECT COUNT(*) INTO @images_count FROM pictures WHERE user_id = userID;

    SELECT
        COUNT(CASE WHEN first_name IS NOT NULL AND first_name != '' THEN 1 END) AS first_name_non_empty,
        COUNT(CASE WHEN last_name IS NOT NULL AND last_name != '' THEN 1 END) AS last_name_non_empty,
        COUNT(CASE WHEN biography IS NOT NULL AND biography != '' THEN 1 END) AS biography_non_empty
    FROM users WHERE id = userID INTO @first_name, @last_name, @biography;

    SET @percentage = @tags_count * 4 + @images_count * 10 + (@first_name + @last_name + @biography) * 10;
    SELECT @percentage;
    
    UPDATE users SET profile_completion_percentage = @percentage WHERE id = userID;
END //

# TAGS PROCEDURES
# =================================================================================================
CREATE PROCEDURE AddTag(
    IN tagName VARCHAR(50),
    OUT tagId INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;
    
    START TRANSACTION;

    INSERT INTO tags (name)
        VALUES (tagName);
    
    COMMIT;

    SELECT LAST_INSERT_ID() INTO tagId;
END //

CREATE PROCEDURE GetAllTags()
BEGIN
    SELECT * FROM tags;
END //

CREATE PROCEDURE UpdateTags(
    IN userID INT,
    IN tag1 INT,
    IN tag2 INT,
    IN tag3 INT,
    IN tag4 INT,
    IN tag5 INT
)
BEGIN
    
    IF tag1 IS NOT NULL THEN
        IF EXISTS (SELECT * FROM users_tags WHERE user_id = userID AND id = 1) THEN
            UPDATE users_tags
                SET tag_id = tag1
                WHERE user_id = userID AND id = 1;
        ELSE
            INSERT INTO users_tags (user_id, tag_id, id)
                VALUES (userID, tag1, 1);
        END IF;
    END IF;

    IF tag2 IS NOT NULL THEN
        IF EXISTS (SELECT * FROM users_tags WHERE user_id = userID AND id = 2) THEN
            UPDATE users_tags
                SET tag_id = tag2
                WHERE user_id = userID AND id = 2;
        ELSE
            INSERT INTO users_tags (user_id, tag_id, id)
                VALUES (userID, tag2, 2);
        END IF;
    ELSE
        DELETE FROM users_tags WHERE user_id = userID AND id = 2;
    END IF;
    
    IF tag3 IS NOT NULL THEN
        IF EXISTS (SELECT * FROM users_tags WHERE user_id = userID AND id = 3) THEN
            UPDATE users_tags
                SET tag_id = tag3
                WHERE user_id = userID AND id = 3;
        ELSE
            INSERT INTO users_tags (user_id, tag_id, id)
                VALUES (userID, tag3, 3);
        END IF;
    ELSE
        DELETE FROM users_tags WHERE user_id = userID AND id = 3;
    END IF;
    
    IF tag4 IS NOT NULL THEN
        IF EXISTS (SELECT * FROM users_tags WHERE user_id = userID AND id = 4) THEN
            UPDATE users_tags
                SET tag_id = tag4
                WHERE user_id = userID AND id = 4;
        ELSE
            INSERT INTO users_tags (user_id, tag_id, id)
                VALUES (userID, tag4, 4);
        END IF;
    ELSE
        DELETE FROM users_tags WHERE user_id = userID AND id = 4;
    END IF;
    
    IF tag5 IS NOT NULL THEN
        IF EXISTS (SELECT * FROM users_tags WHERE user_id = userID AND id = 5) THEN
            UPDATE users_tags
                SET tag_id = tag5
                WHERE user_id = userID AND id = 5;
        ELSE
            INSERT INTO users_tags (user_id, tag_id, id)
                VALUES (userID, tag5, 5);
        END IF;
    ELSE
        DELETE FROM users_tags WHERE user_id = userID AND id = 5;
    END IF;

    CALL UpdateProfileCompletionPercentage(userID);
END //
    
    
# IMAGE PROCEDURES
# =================================================================================================

# Upload image
CREATE PROCEDURE UploadImage(
    IN userID INT,
    IN _position INT,
    IN imageUrl TEXT
)
BEGIN
    IF _position < 1 OR _position > 5 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Position must be between 1 and 5';
    END IF;
    
    SELECT COUNT(@count) FROM pictures WHERE user_id = userID AND pictures.position = _position;
    
    IF @count > 0 THEN
        UPDATE pictures SET image_url = imageUrl WHERE user_id = userID AND pictures.position = _position;
    ELSE
        INSERT INTO pictures (user_id, pictures.position, image_url)
            VALUES (userID, _position, imageUrl);
    END IF;
    
    CALL UpdateProfileCompletionPercentage(userID);
END //

# DeleteImage
CREATE PROCEDURE DeleteImage(
    IN userID INT,
    IN position INT
)
BEGIN
    IF position < 1 OR position > 5
    THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Position must be between 1 and 5';
    END IF;
    
    DELETE FROM pictures WHERE user_id = userID AND pictures.position = position;
    CALL UpdateProfileCompletionPercentage(userID);
END //

# SwapImages
CREATE PROCEDURE SwapImages(
    IN userID INT,
    IN position1 INT,
    IN position2 INT
)
BEGIN
    IF position1 < 1 OR position2 < 1 OR position1 > 5 OR position2 > 5
    THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Position must be between 1 and 5';
    END IF;
    
    UPDATE pictures
    SET position = CASE position
        WHEN position1 THEN position2
        WHEN position2 THEN position1
        ELSE position
    END
    WHERE user_id = userID AND position IN (position1, position2);
END //

# Get user Images
CREATE PROCEDURE GetUserImage(
    IN userID INT,
    IN _position INT
)
BEGIN
    SELECT image_url
    FROM pictures
    WHERE user_id = userID AND pictures.position = _position;
END //

# Insert generated user
CREATE PROCEDURE AddGeneratedUser(
    IN _username VARCHAR(50),
    IN _password BINARY(32),
    IN _email VARCHAR(50),
    IN _salt VARCHAR(16),
    IN birthDate DATE,
    IN firstName VARCHAR(50),
    IN lastName VARCHAR(50),
    IN genderID INT,
    IN sexualOrientation INT,
    IN _coordinates VARCHAR(100),
    IN _address VARCHAR(100),
    IN _biography VARCHAR(280),
    IN _fame INT,
    IN tag1 INT,
    IN tag2 INT,
    IN tag3 INT,
    IN tag4 INT,
    IN tag5 INT,
    IN image1 TEXT,
    IN image2 TEXT,
    IN image3 TEXT,
    IN image4 TEXT,
    IN image5 TEXT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;
    
    START TRANSACTION;

    INSERT INTO users (username, password, email, salt, birth_date, 
                       first_name, last_name, gender_id, sexual_orientation, 
                       coordinates, address, biography, fame, is_verified)
        VALUES (_username, _password, _email, _salt, birthDate, 
                firstName, lastName, genderID, sexualOrientation,
                POINT(
                        CAST(SUBSTRING_INDEX(_coordinates, ',', 1) AS DECIMAL(10,6)),
                        CAST(SUBSTRING_INDEX(_coordinates, ',', -1) AS DECIMAL(10,6))
                ), 
                _address, _biography, _fame, 1);
    
    COMMIT ;
    
    SELECT LAST_INSERT_ID() INTO @userID;
    
    START TRANSACTION;
    
    CALL UpdateTags(@userID, tag1, tag2, tag3, tag4, tag5);
    
    COMMIT;
    
    START TRANSACTION;
    
    IF image1 IS NOT NULL THEN
        CALL UploadImage(@userID, 1, image1);
    END IF;
    
    IF image2 IS NOT NULL THEN
        CALL UploadImage(@userID, 2, image2);
    END IF;
    
    IF image3 IS NOT NULL THEN
        CALL UploadImage(@userID, 3, image3);
    END IF;
    
    IF image4 IS NOT NULL THEN
        CALL UploadImage(@userID, 4, image4);
    END IF;
    
    IF image5 IS NOT NULL THEN
        CALL UploadImage(@userID, 5, image5);
    END IF;
    
    COMMIT;
    
    CALL UpdateProfileCompletionPercentage(@userID);
    CALL UpdateProfileStatus(@userID, 2);
END //

CREATE PROCEDURE GetUserMatches(IN userID INT)
BEGIN
    SELECT
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        p.image_url
    FROM users u
             LEFT JOIN pictures p ON u.id = p.user_id AND p.position = 1
    WHERE u.id IN (
        SELECT first_userid FROM `match` WHERE second_userid = userID AND status = 1
        UNION
        SELECT second_userid FROM `match` WHERE first_userid = userID AND status = 1);
END //

CREATE PROCEDURE LikeUser(
    IN userID INT,
    IN likedUser VARCHAR(50),
    IN isLike BOOLEAN,
    OUT matchStatus INT,
    OUT oldMatchStatus INT,
    OUT isBlocked INT
)
BEGIN
    SET matchStatus = 0;
    SELECT id INTO @likedUserId FROM users WHERE username = likedUser;
    
    SELECT COUNT(*) INTO @count FROM liked 
            WHERE first_userid = userID AND second_userid = @likedUserId OR 
                    first_userid = @likedUserId AND second_userid = userID;
    
    SELECT status INTO oldMatchStatus FROM `match` 
            WHERE (first_userid = userID AND second_userid = @likedUserId) OR 
                  (first_userid = @likedUserId AND second_userid = userID);
    
    SELECT is_blocked INTO isBlocked FROM blocked 
        WHERE from_userid = @likedUserId AND to_userid = userID;
    
    IF @count = 0 THEN
        INSERT INTO liked (first_userid, second_userid, first_user_like_status)
            VALUES (userID, @likedUserId, isLike);

        UPDATE users SET fame = fame + 1
            WHERE id = userID;
    ELSE
        UPDATE liked SET first_user_like_status = isLike
            WHERE (first_userid = userID AND second_userid = @likedUserId);
        UPDATE liked SET second_user_like_status = isLike
            WHERE (first_userid = @likedUserId AND second_userid = userID);
        
        IF isLike = TRUE THEN
            SELECT first_user_like_status, second_user_like_status INTO @first, @second
                FROM liked WHERE (first_userid = userID AND second_userid = @likedUserId) 
                OR (first_userid = @likedUserId AND second_userid = userID);
            IF @first = 1 AND @second = 1 THEN
                SET matchStatus = 1;
            END IF;

            UPDATE users SET fame = fame + 1
                WHERE id = @likedUserId;
        ELSE
            UPDATE users SET fame = fame - 1
            WHERE id = @likedUserId;
        END IF;  
    END IF;
END //

CREATE PROCEDURE BlockUser(
    IN fromUserId INT,
    IN toUser VARCHAR(50),
    IN isBlocked BOOLEAN
)
BEGIN
    SELECT id INTO @toUserId FROM users WHERE username = toUser;

    SELECT COUNT(*) INTO @count FROM blocked
        WHERE from_userid = fromUserId AND to_userid = @toUserId;

    IF @count = 0 THEN
        INSERT INTO blocked (from_userid, to_userid, is_blocked)
        VALUES (fromUserId, @toUserId, isBlocked);
    ELSE
        UPDATE blocked SET is_blocked = isBlocked
            WHERE (from_userid = fromUserId AND to_userid = @toUserId);
    END IF;
END //

CREATE PROCEDURE IsBlocked(
    IN fromUser VARCHAR(50),
    IN toUser VARCHAR(50)
)
BEGIN 
    SELECT is_blocked FROM blocked
        WHERE from_userid = (SELECT id FROM users WHERE username = fromUser)
          AND to_userid = (SELECT id FROM users WHERE username = toUser);
END //
    

CREATE PROCEDURE ReportUser(
    IN fromUserId INT,
    IN reportedUser VARCHAR(50),
    OUT alreadyReported INT
)
BEGIN
    SELECT id INTO @toUserId FROM users WHERE username = reportedUser;
    
    SELECT COUNT(*) INTO alreadyReported FROM reports
        WHERE userid = fromUserId AND userid_reported = @toUserId;
    
    IF alreadyReported = 0 THEN
        INSERT INTO reports (userid, userid_reported)
            VALUES (fromUserId, @toUserId);
    END IF;
END //

CREATE PROCEDURE AddToHistory(
    IN user_id INT,
    IN userVisited VARCHAR(50),
    OUT result INT
)
BEGIN
    SELECT id INTO @visitedUserId FROM users WHERE username = userVisited;
    
    SELECT COUNT(*) INTO result FROM views 
        WHERE userid = user_id AND userid_seen = @visitedUserId;
    
    IF result = 0 THEN
        INSERT INTO views (userid, userid_seen)
            VALUES (user_id, @visitedUserId);
    END IF;
END //

CREATE PROCEDURE GetName(
    IN user_id INT
)
BEGIN
    SELECT first_name, last_name FROM users WHERE id = user_id;
END //

CREATE PROCEDURE GetHistory(
    IN user_id INT
)
BEGIN
    SELECT u.username, u.first_name, u.last_name
    FROM users u
        WHERE u.id IN (SELECT userid_seen FROM views WHERE userid = user_id);
END //

CREATE PROCEDURE UpdateEmail(
    IN userID INT,
    IN newEmail VARCHAR(50)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;
    
    START TRANSACTION;

    UPDATE users SET email = newEmail 
                 WHERE id = userID AND email != newEmail;
    
    COMMIT;
END //

CREATE PROCEDURE GetNotifications(
    IN userID INT
)
BEGIN
    SELECT * FROM notification n
        WHERE n.userid = userID 
        ORDER BY n.created_on DESC;
END //

DELIMITER ;