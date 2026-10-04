-- 004_rename_roles.sql — role names in members.roles: "master" -> "admin" (Admin), "notes" -> "noteadmin" (Note Admin).
-- Safe to run more than once: rows that already use the new names are not changed.
-- Paste in the Domeneshop database browser (SQL) and run.

USE `armeriddereno05`;

SET NAMES utf8mb4;

-- SAFETY: never run this in the old live site's database.
SET @STOP_this_is_the_live_database_choose_the_dev_database = IF(DATABASE() = 'armeriddere', (SELECT 1 UNION SELECT 2), 1);

UPDATE members
SET roles = REPLACE(REPLACE(roles, '"master"', '"admin"'), '"notes"', '"noteadmin"')
WHERE roles LIKE '%"master"%' OR roles LIKE '%"notes"%';

-- Shows who has a role now
SELECT id, first_name, last_name, roles FROM members WHERE roles <> '[]' ORDER BY id;
