-- 003_fix_song_file_paths.sql — run ONCE. Paste in the Domeneshop database browser (SQL) and run.
--
-- Song files saved before this fix only stored the file name ("Bromance_Mix.mp3"), so the app looked for
-- storage/Bromance_Mix.mp3 and got 404. This adds the folder the files really are in on the server:
--   sound files (Lyd, Toneangiver) -> songs/melody/      sheet music (Noter, PDF) -> songs/pdf/
-- Rows that already have a folder, or a web address (http...), are left as they are. Safe to run twice.

USE `armeriddereno05`;

SET NAMES utf8mb4;

-- SAFETY: never run this in the old live site's database.
SET @STOP_this_is_the_live_database_choose_the_dev_database = IF(DATABASE() = 'armeriddere', (SELECT 1 UNION SELECT 2), 1);

UPDATE song_voice_files
SET file = CONCAT(IF(type = 'sheet', 'songs/pdf/', 'songs/melody/'), file)
WHERE file IS NOT NULL AND file <> '' AND file NOT LIKE '%/%' AND file NOT LIKE 'http%';

-- Shows the result: every file should now start with songs/melody/ or songs/pdf/.
SELECT s.name AS song, f.name, f.type, f.file FROM song_voice_files f JOIN songs s ON s.id = f.song_id ORDER BY s.name, f.sort_order;
