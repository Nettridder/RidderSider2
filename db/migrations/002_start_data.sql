-- 002_start_data.sql — the first rows a new, empty database needs. Run once, right after 001_schema.sql.
--
-- How (phpMyAdmin on Domeneshop):
--   1. Click the DEV database on the left (never the old "armeriddere" database).
--   2. Import -> choose 001_schema.sql -> Go. Then Import -> choose 002_start_data.sql -> Go.
--   3. Log in on https://dev.armeriddere.no/app/ — first set a password, see "Your password" at the bottom.
--
-- Values follow .info/DatabaseStrukture.md.

SET NAMES utf8mb4;

-- SAFETY: same check as in 001_schema.sql — never run this in the old live site's database.
SET @STOP_this_is_the_live_database_choose_the_dev_database = IF(DATABASE() = 'armeriddere', (SELECT 1 UNION SELECT 2), 1);
SET @STOP_old_site_tables_found_choose_the_dev_database = IF(EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('Songar', 'Sjangrar', 'mainwp_posts')), (SELECT 1 UNION SELECT 2), 1);

-- ==================== The first member: owner and admin ====================
-- is_owner = 1: always full access, and other admins cannot change this account (see "Eier-tilgang").
-- roles ["master"]: the Admin pages + Note-admin.
-- Started this semester; rank Ridder as in the example in DatabaseStrukture.md.
-- No password yet (NULL = cannot log in until a password is set, see the bottom of this file).
INSERT INTO members
  (email, first_name, last_name, voice_group, status, `rank`, roles, is_owner,
   joined_year, joined_term, email_level, show_public, image_file)
VALUES
  ('kristianhafell@gmail.com', 'Kristian', 'Hafell', 'T2', 'active', 'ridder', '["master"]', 1,
   YEAR(CURDATE()), IF(MONTH(CURDATE()) >= 7, 'autumn', 'spring'), 'all', 1, 'portrett-kristian-1x1-1-scaled.jpg');

SET @owner = LAST_INSERT_ID();
UPDATE members SET created_by = @owner, updated_by = @owner WHERE id = @owner;

-- ==================== Settings the app reads ====================
-- weekly_practice_goal_minutes: "Ukemål" on the front page of the app (Note-admin can change it).
-- app_background / attendance_background: fixed background images, chosen on Admin -> Bakgrunnsbilete.
INSERT INTO settings (created_by, updated_by, `key`, value) VALUES
  (@owner, @owner, 'weekly_practice_goal_minutes', '60'),
  (@owner, @owner, 'app_background', 'null'),
  (@owner, @owner, 'attendance_background', 'null');

-- ==================== The example achievement from DatabaseStrukture.md ====================
-- The rule itself lives in the code (key practice_total_1_day = 24 hours of practice in total).
INSERT INTO achievements (created_by, updated_by, `key`, title, description, image, trigger_event, is_secret, sort_order) VALUES
  (@owner, @owner, 'practice_total_1_day', 'Øvd i en hel dag', 'Registrert til sammen 24 timer egenøving.', 'standardillustrasjon.png', 'practice_logged', 0, 1);

-- ==================== Your password ====================
-- Two ways to get in:
--   A) On the login page click "Glemt passord, eller ny bruker?" and type kristianhafell@gmail.com.
--      You get an email with a link where you choose a password (needs mail to work on Domeneshop).
--   B) Without email: on your own computer run   php www/db/tools/set_password.php
--      It asks for a password and prints one UPDATE line. Paste that line in phpMyAdmin -> SQL -> Go.
