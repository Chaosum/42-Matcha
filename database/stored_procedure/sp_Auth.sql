DELIMITER //

CREATE PROCEDURE InsertNewAccount(
    IN userName VARCHAR(50),
    IN userPassword BINARY(32),
    IN userMail VARCHAR(100),
    IN userBirthDate DATE,
    IN verificationLink VARCHAR(255),
    IN verificationLinkExpiration DATETIME,
    IN inputSalt VARCHAR(255)
)
BEGIN
    INSERT INTO db.users (username, password, email, birth_date, salt, email_verification_link, email_verification_link_expiration)
        VALUES (userName, 
                userPassword, 
                userMail, 
                userBirthDate,
                inputSalt,
                verificationLink, 
                verificationLinkExpiration);
END //

CREATE PROCEDURE GetUserPasswordByUsername(IN inputUsername VARCHAR(50))
BEGIN
    SELECT id, password, salt, is_verified
    FROM users
    WHERE username = inputUsername;
END //

CREATE PROCEDURE updateEmailVerificationLink(
    IN userMail VARCHAR(100),=
    IN verificationLink VARCHAR(255),
    IN verificationLinkExpiration DATETIME
)
BEGIN
    UPDATE users
        SET email_verification_link = verificationLink,
            email_verification_link_expiration = verificationLinkExpiration
            WHERE email = userMail;
END //

CREATE PROCEDURE GetUserMailByUsername(IN inputUsername VARCHAR(50))
BEGIN
    SELECT email
    FROM users
    WHERE username = inputUsername;
END //

CREATE PROCEDURE getVerificationAccountInfo(IN inputVerifyLink VARCHAR(250))
BEGIN
    SELECT id, is_verified, email_verification_link, email_verification_link_expiration, email
        FROM users
        WHERE email_verification_link = inputVerifyLink;
END //

CREATE PROCEDURE assertAccountVerification (IN user_id INT)
BEGIN
    UPDATE users
        SET is_verified = TRUE
            WHERE id = user_id;
END //

CREATE PROCEDURE GetVerificationForgottenPasswordInfo(IN inputVerifyLink VARCHAR(250))
BEGIN
    SELECT forgotten_password_link, forgotten_password_link_expiration, email, username
        FROM users
        WHERE forgotten_password_link = inputVerifyLink;
END //

CREATE PROCEDURE assertResetPassword (
    IN userMail VARCHAR(100),
    IN userPassword BINARY(32),
    IN inputSalt VARCHAR(255)
)
BEGIN
    UPDATE users
        SET password = userPassword,
            salt = inputSalt
            WHERE email = userMail;
END //

CREATE PROCEDURE forgottenPasswordLink(
    IN inputForgottenPasswordLink VARCHAR(250), 
    IN inputMail VARCHAR(100)
)
BEGIN
    UPDATE users
        SET forgotten_password_link = inputForgottenPasswordLink,
            forgotten_password_link_expiration = NOW() + INTERVAL 1 HOUR
        WHERE email = inputMail;
END //

CREATE PROCEDURE getuserid (IN inputUsername VARCHAR(255))
BEGIN
    SELECT id
        FROM users
        WHERE userName = inputUsername;
END //



DELIMITER ;