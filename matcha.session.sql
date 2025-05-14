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
        GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ",") AS tags,
        MAX(CASE WHEN p.position = 1 THEN p.image_url END) AS profile_picture,  -- Utilisation de MAX
        GROUP_CONCAT(
            CASE WHEN p.position != 1 THEN p.image_url END
            ORDER BY p.position SEPARATOR ","
        ) AS pictures
        u.birth_date,
        u.profile_status
FROM users u
LEFT JOIN pictures p
    ON p.user_id = u.id
LEFT JOIN users_tags ut
    ON ut.user_id = u.id
LEFT JOIN tags t
    ON t.id = ut.tag_id
WHERE u.username = @username
GROUP BY u.id, u.first_name,
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
