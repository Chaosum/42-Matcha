CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(200) NOT NULL,
    password VARCHAR(200) NOT NULL,
    username VARCHAR(50),
    is_verified BOOLEAN DEFAULT FALSE,
    birth_date TIMESTAMP,
    gender_id INT,
    orientation_id INT,
    rank INT,
    profile_picture_id INT,
    profile_completed BOOLEAN DEFAULT FALSE,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE liked (
    first_userid INT NOT NULL,
    second_userid INT NOT NULL,
    first_user_like_status BOOLEAN DEFAULT FALSE,
    second_user_like_status BOOLEAN DEFAULT FALSE,
    like_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    PRIMARY KEY (first_userid, second_userid),
    FOREIGN KEY (first_userid) REFERENCES users(id),
    FOREIGN KEY (second_userid) REFERENCES users(id)
)

CREATE TABLE blocked (
    from_userid INT NOT NULL,
    to_userid INT NOT NULL,
    blocked_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    PRIMARY KEY (from_userid, to_userid),
    FOREIGN KEY (from_userid) REFERENCES users(id),
    FOREIGN KEY (to_userid) REFERENCES users(id)
)

CREATE TABLE users_tags (
    userid INT NOT NULL,
    tagid INT NOT NULL,
    PRIMARY KEY (userid, tagid),
    FOREIGN KEY (userid) REFERENCES users(id),
    FOREIGN KEY (tagid) REFERENCES tags(id)
)

CREATE TABLE tag (
    id SERIAL INT PRIMARY KEY ,
    name VARCHAR(30) UNIQUE NOT NULL
)