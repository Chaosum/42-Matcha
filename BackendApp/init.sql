CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(200) NOT NULL,
    password VARCHAR(200) NOT NULL,
    username VARCHAR(50),
    is_verified BOOLEAN DEFAULT FALSE,
    birth_date TIMESTAMP,
    gender_id INT,
    rank INT,
    profile_picture_id INT,
    profile_completed BOOLEAN DEFAULT FALSE,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    FOREIGN KEY (gender_id) REFERENCES gender(id),
    FOREIGN KEY (profile_picture_id) REFERENCES pictures(id)
);

CREATE TABLE liked (
    first_userid INT NOT NULL,
    second_userid INT NOT NULL,
    first_user_like_status BOOLEAN DEFAULT FALSE,
    second_user_like_status BOOLEAN DEFAULT FALSE,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    PRIMARY KEY (first_userid, second_userid),
    FOREIGN KEY (first_userid) REFERENCES users(id),
    FOREIGN KEY (second_userid) REFERENCES users(id)
);

CREATE TABLE blocked (
    from_userid INT NOT NULL,
    to_userid INT NOT NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    PRIMARY KEY (from_userid, to_userid),
    FOREIGN KEY (from_userid) REFERENCES users(id),
    FOREIGN KEY (to_userid) REFERENCES users(id)
);

CREATE TABLE users_tags (
    userid INT NOT NULL,
    tagid INT NOT NULL,
    PRIMARY KEY (userid, tagid),
    FOREIGN KEY (userid) REFERENCES users(id),
    FOREIGN KEY (tagid) REFERENCES tags(id)
);

CREATE TABLE tag (
    id SERIAL INT PRIMARY KEY ,
    name VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE pictures (
    id INT SERIAL NOT NULL,
    userid INT NOT NULL,
    picture BYTEA,
    picture_position INT
);

CREATE TABLE gender (
    id INT SERIAL PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL
);

CREATE TABLE attracted_by (
    userid INT NOT NULL,
    genderid INT NOT NULL,
    FOREIGN KEY (userid) REFERENCES users(id),
    FOREIGN KEY (genderid) REFERENCES gender(id)
);

CREATE TABLE match (
    first_userid INT NOT NULL,
    second_userid INT NOT NULL,
    conversationid INT NOT NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    PRIMARY KEY (first_userid, second_userid),
    FOREIGN KEY (conversationid) REFERENCES conversation(id),
    FOREIGN KEY (first_userid) REFERENCES users(id),
    FOREIGN KEY (second_userid) REFERENCES users(id)
)

CREATE TABLE conversation (
    id INT SERIAL PRIMARY KEY,
    matchid INT NOT NULL,
    message_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    content VARCHAR(255),
    message_status_id INT NOT NULL DEFAULT 0,
    FOREIGN KEY (message_status_id) REFERENCES status(id),
    FOREIGN KEY (matchid) REFERENCES match(id)
)

CREATE TABLE status (
    id INT SERIAL NOT NULL,
    name VARCHAR UNIQUE NOT NULL
)

CREATE TABLE notification (
    id INT SERIAL NOT NULL,
    userid INT,
    content VARCHAR NOT NULL,
    statusid INT NOT NUL,
    FOREIGN KEY (userid) REFERENCES users(id),
    FOREIGN KEY (statusid) REFERENCES status(id)
)