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
    IN inputMail VARCHAR(255),
    OUT userExists INT
)
BEGIN 
    SELECT COUNT(*) INTO userExists
        FROM users
        WHERE email = inputMail;
END //

DELIMITER ;