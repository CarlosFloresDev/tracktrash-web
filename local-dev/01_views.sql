-- Local-only definitions of the three indicator views that the backend maps but does not ship.
-- Column names and types follow TrackTrashDBContext. These are NOT part of the backend repository.

CREATE OR REPLACE VIEW vw_general_indicators AS
SELECT
    (SELECT count(*) FROM users WHERE is_active)::bigint                                 AS total_users,
    (SELECT count(*) FROM organizations WHERE is_active)::bigint                         AS total_organizations,
    (SELECT count(*) FROM gatherers WHERE verification_status_id = 2 AND is_active)::bigint AS verified_gatherers,
    (SELECT count(*) FROM collect_requests)::bigint                                      AS total_requests,
    (SELECT count(*) FROM collect_requests WHERE status_id = 4)::bigint                  AS completed_requests,
    (SELECT count(*) FROM pickup_services WHERE status_id = 4)::bigint                   AS completed_services,
    COALESCE((SELECT sum(quantity) FROM recovered_materials WHERE unit_id = 1), 0)::numeric AS recovered_kilograms;

CREATE OR REPLACE VIEW vw_residues_by_type AS
SELECT
    rt.residue_type_id,
    rt.name::varchar(100) AS residue_type,
    CASE rt.residue_category_id WHEN 1 THEN 'Recyclable' WHEN 2 THEN 'Organic' ELSE 'General' END::varchar(40) AS category,
    CASE rm.unit_id WHEN 1 THEN 'Kg' WHEN 2 THEN 'Unit' ELSE 'Liters' END::varchar(20) AS unit,
    sum(rm.quantity)::numeric AS recovered_quantity
FROM recovered_materials rm
JOIN residue_types rt ON rt.residue_type_id = rm.residue_type_id
GROUP BY rt.residue_type_id, rt.name, rt.residue_category_id, rm.unit_id;

CREATE OR REPLACE VIEW vw_gatherer_grades AS
SELECT
    g.gatherer_id,
    u.first_name,
    u.last_name,
    round(avg(gr.score)::numeric, 2) AS average_score,
    count(gr.grade_id)::bigint       AS total_grades
FROM gatherers g
JOIN users u ON u.user_id = g.user_id
JOIN gatherer_grades gg ON gg.gatherer_id = g.gatherer_id
JOIN grades gr ON gr.grade_id = gg.grade_id
GROUP BY g.gatherer_id, u.first_name, u.last_name;
