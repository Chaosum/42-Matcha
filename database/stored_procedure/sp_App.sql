DELIMITER //

CREATE PROCEDURE GetMatchingProfiles (
    IN ref_user_id INT,
    IN max_age_gap INT,
    IN max_distance_gap INT,
    IN fame_gap INT,
    IN sort_by VARCHAR(50),
    IN ref_fame INT,
    IN ref_birthdate DATE,
    IN ref_gender_id INT,
    IN ref_sexual_orientation_id INT,
    IN ref_coordinates_str VARCHAR(100),
    IN result_offset INT,
    IN result_limit INT,
    OUT total_count INT
)
BEGIN
    -- 1. Calcul du nombre total de résultats sans LIMIT
    SELECT COUNT(DISTINCT u.id) INTO total_count
    FROM users u
    JOIN pictures AS p ON p.user_id = u.id
    JOIN users_tags AS ut ON ut.user_id = u.id
    JOIN tags t ON t.id = ut.tag_id
    JOIN gender g ON g.id = u.gender_id
    LEFT JOIN blocked b 
        ON (b.from_userid = ref_user_id AND b.to_userid = u.id)
        OR (b.from_userid = u.id AND b.to_userid = ref_user_id)
    WHERE u.id != ref_user_id
    AND b.from_userid IS NULL
    AND p.position = 1
    AND ABS(ref_fame - u.fame) <= fame_gap
    AND ST_Distance_Sphere(ST_GeomFromText(ref_coordinates_str), u.coordinates)/1000 <= max_distance_gap
    AND ABS(TIMESTAMPDIFF(YEAR, u.birth_date, ref_birthdate)) <= max_age_gap
    AND (
        (ref_sexual_orientation_id = 1 AND u.gender_id != ref_gender_id AND (u.sexual_orientation = 1 OR u.sexual_orientation = 3))
        OR (ref_sexual_orientation_id = 2 AND u.gender_id = ref_gender_id AND (u.sexual_orientation = 2 OR u.sexual_orientation = 3))
        OR (ref_sexual_orientation_id = 3 AND NOT (u.gender_id = ref_gender_id AND u.sexual_orientation = 1))
    );

    -- 2. Résultats paginés
    SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.birth_date,
        u.address,
        u.fame,
        g.name AS gender,
        GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ",") AS tags,
        ST_Distance_Sphere(ST_GeomFromText(ref_coordinates_str), u.coordinates)/1000 AS distance_to_ref,
        (
            u.fame 
            - ((ST_Distance_Sphere(ST_GeomFromText(ref_coordinates_str), u.coordinates) / 1000)) 
            + (50 * (
                SELECT COUNT(*) 
                FROM users_tags ut2 
                JOIN tags t2 ON ut2.tag_id = t2.id 
                WHERE ut2.user_id = u.id
                  AND t2.name IN (
                      SELECT t3.name FROM users_tags ut3 
                      JOIN tags t3 ON ut3.tag_id = t3.id 
                      WHERE ut3.user_id = ref_user_id
                  )
            ))
        ) AS calculatedFame,
        p.image_url,
        (
            SELECT COUNT(*) 
            FROM users_tags ut4 
            JOIN tags t4 ON ut4.tag_id = t4.id 
            WHERE ut4.user_id = u.id 
              AND t4.name IN (
                  SELECT t5.name FROM users_tags ut5 
                  JOIN tags t5 ON ut5.tag_id = t5.id 
                  WHERE ut5.user_id = ref_user_id
              )
        ) AS common_tags 
    FROM users u
    JOIN pictures AS p ON p.user_id = u.id
    JOIN users_tags AS ut ON ut.user_id = u.id
    JOIN tags t ON t.id = ut.tag_id
    JOIN gender g ON g.id = u.gender_id
    LEFT JOIN blocked b 
        ON (b.from_userid = ref_user_id AND b.to_userid = u.id)
        OR (b.from_userid = u.id AND b.to_userid = ref_user_id)
    WHERE u.id != ref_user_id
    AND b.from_userid IS NULL
    AND p.position = 1
    AND (
        (fame_gap != 0 AND ABS(ref_fame - u.fame) <= fame_gap) OR fame_gap = 0
    )
    AND (
        (max_distance_gap != 0 AND (ST_Distance_Sphere(ST_GeomFromText(ref_coordinates_str), u.coordinates) / 1000) <= max_distance_gap) OR max_distance_gap = 0
    )
    AND (
        (max_age_gap != 0 AND ABS(TIMESTAMPDIFF(YEAR, u.birth_date, ref_birthdate)) <= max_age_gap) OR max_age_gap = 0
    )
    AND (
        (ref_sexual_orientation_id = 1 AND u.gender_id != ref_gender_id AND (u.sexual_orientation = 1 OR u.sexual_orientation = 3))
        OR (ref_sexual_orientation_id = 2 AND u.gender_id = ref_gender_id AND (u.sexual_orientation = 2 OR u.sexual_orientation = 3))
        OR (ref_sexual_orientation_id = 3 AND NOT (u.gender_id = ref_gender_id AND u.sexual_orientation = 1))
    )
    GROUP BY u.id, u.username, u.first_name, u.birth_date, u.address, distance_to_ref, common_tags, p.image_url, g.name
    ORDER BY 
        CASE 
            WHEN sort_by = 'birth_date' THEN u.birth_date
            WHEN sort_by = 'distance' THEN CAST(distance_to_ref AS DECIMAL)
        END ASC,
        CASE 
            WHEN sort_by = 'fame' THEN u.fame
            WHEN sort_by = 'common_tags' THEN common_tags
        END DESC,
        calculatedFame DESC
    LIMIT result_limit OFFSET result_offset;
END //

DELIMITER ;
