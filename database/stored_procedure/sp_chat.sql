DELIMITER //

CREATE PROCEDURE SaveMessage (
    IN senderUsername VARCHAR(50),
    IN receiverUsername VARCHAR(50),
    IN message VARCHAR(255),
    IN _timestamp TIMESTAMP
)
BEGIN
    SELECT id INTO @receiverId FROM users WHERE username = receiverUsername;
    SELECT id INTO @senderId FROM users WHERE username = senderUsername;
    
    SELECT id INTO @matchId FROM `match` 
            WHERE (first_userid = @senderId AND second_userid = @receiverId) 
                OR (first_userid = @receiverId AND second_userid = @senderId);
    
    INSERT INTO message (match_id, sender_id, receiver_id, content, timestamp)
        VALUES (@matchId, @senderId, @receiverId, message, _timestamp);
END //

CREATE PROCEDURE GetChannelMessages (
    IN userId VARCHAR(50),
    IN username VARCHAR(50)
)
BEGIN
    SELECT id INTO @secondUser FROM users WHERE users.username = username;
    
    SELECT * FROM message
            WHERE match_id IN (
                SELECT id FROM `match` 
                    WHERE (first_userid = userId AND second_userid = @secondUser) 
                        OR (first_userid = @secondUser AND second_userid = userId)
            ) ORDER BY timestamp;
END //

CREATE PROCEDURE GetMessages (
    IN userId INT
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE matchId INT;
    DECLARE cur CURSOR FOR 
        SELECT id FROM `match` 
            WHERE first_userid = userId OR second_userid = userId;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO matchId;
        IF done THEN
            LEAVE read_loop;
        END IF;

        SELECT m.id, m.sender_id, m.receiver_id, m.content, m.timestamp 
            FROM message m 
                WHERE m.match_id = matchId 
                    ORDER BY m.timestamp DESC LIMIT 50;
    END LOOP;
    
    CLOSE cur;
END //

CREATE PROCEDURE SendChatNotification (
    IN senderId INT,
    IN receiverId INT
)
BEGIN
    DECLARE senderUsername VARCHAR(50);
    DECLARE receiverUsername VARCHAR(50);
    
    SELECT username INTO senderUsername FROM users WHERE id = senderId;
    SELECT username INTO receiverUsername FROM users WHERE id = receiverId;
    
    INSERT INTO notification (userid, content)
        VALUES (receiverId, CONCAT(senderUsername, ' sent you a message!'));
END //

CREATE PROCEDURE SaveNotification (
    IN _userID INT,
    IN _content VARCHAR(255)
)
BEGIN
    INSERT INTO notification (userid, content)
        VALUES (_userID, _content);
END //

CREATE PROCEDURE SaveLastSeen (
    IN _userID INT,
    IN _lastSeen TIMESTAMP
)
BEGIN
    UPDATE users SET last_time_online = _lastSeen WHERE id = _userID;
END //

DELIMITER ;
