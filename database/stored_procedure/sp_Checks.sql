DELIMITER //

CREATE PROCEDURE CheckUsernameTaken(
    IN username VARCHAR(255)
)
BEGIN
    SELECT COUNT(*) 
        FROM users 
        WHERE users.username = username;
END //

CREATE PROCEDURE CheckMailTaken(
    IN userMail VARCHAR(255)
)
BEGIN
    SELECT COUNT(*) 
        FROM users 
        WHERE email = userMail;
END //


CREATE PROCEDURE CheckUserExist(
    IN inputUsername VARCHAR(255),
    IN inputMail VARCHAR(255),
    OUT userExists INT
)
BEGIN 
    SELECT COUNT(*) INTO userExists
        FROM users
        WHERE username = inputUsername
          AND email = inputMail;
END //

DELIMITER ;