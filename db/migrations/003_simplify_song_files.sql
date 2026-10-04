-- 003_simplify_song_files.sql — run ONCE on a database made with the OLD 001_schema.sql (before 2026-10-05).
-- A database made with the current 001_schema.sql already has this layout: then skip this file.
-- Paste in the Domeneshop database browser (SQL) and run.
--
-- What changes (makes importing from the old site a straight copy):
--   * The PDF becomes a column on songs: sheet_file (file name only, like old Songar.Notefilnamn).
--   * The pitch pipe becomes columns on songs: pitch_notes ("E4 C4 G3") + pitch_gap_ms.
--   * song_voice_files keeps only sound files: name (= Stemme), file (= Mp3filnamn) and sort_order.
--   * Folders are no longer stored: "songs/melody/Bromance_Mix.mp3" becomes "Bromance_Mix.mp3".
--   * Repertoires get "hidden_for_former" (Skjult for ypp.com.), on by default.
-- Nothing is lost: PDF and pitch rows are moved onto their song before the old columns are removed.

USE `armeriddereno05`;

SET NAMES utf8mb4;

-- SAFETY: never run this in the old live site's database.
SET @STOP_this_is_the_live_database_choose_the_dev_database = IF(DATABASE() = 'armeriddere', (SELECT 1 UNION SELECT 2), 1);

ALTER TABLE songs
  ADD COLUMN IF NOT EXISTS sheet_file   varchar(256) NULL AFTER choreography_url,
  ADD COLUMN IF NOT EXISTS pitch_notes  varchar(255) NULL AFTER sheet_file,
  ADD COLUMN IF NOT EXISTS pitch_gap_ms smallint     NULL AFTER pitch_notes;

-- PDF rows -> songs.sheet_file (file name only)
UPDATE songs s
JOIN song_voice_files f ON f.song_id = s.id AND f.type = 'sheet' AND f.file IS NOT NULL AND f.file <> ''
SET s.sheet_file = SUBSTRING_INDEX(f.file, '/', -1);

-- Pitch rows -> songs.pitch_notes, in their order, separated by spaces
UPDATE songs s
JOIN (SELECT song_id, GROUP_CONCAT(start_note ORDER BY sort_order, id SEPARATOR ' ') AS notes
      FROM song_voice_files WHERE type = 'pitch' AND start_note IS NOT NULL AND start_note <> '' GROUP BY song_id) p
  ON p.song_id = s.id
SET s.pitch_notes = p.notes;

-- Only sound files with a file stay in song_voice_files
DELETE FROM song_voice_files WHERE type <> 'audio' OR file IS NULL OR file = '';
UPDATE song_voice_files SET file = SUBSTRING_INDEX(file, '/', -1) WHERE file NOT LIKE 'http%';

ALTER TABLE song_voice_files
  DROP COLUMN IF EXISTS voice,
  DROP COLUMN IF EXISTS type,
  DROP COLUMN IF EXISTS start_note,
  MODIFY file varchar(256) NOT NULL,
  MODIFY sort_order smallint NOT NULL DEFAULT 0;

-- Repertoires: "Skjult for ypp.com." (on by default = former members don't see the repertoire)
ALTER TABLE repertoires ADD COLUMN IF NOT EXISTS hidden_for_former tinyint(1) NOT NULL DEFAULT 1 AFTER is_visible;

-- Shows the result
SELECT id, name, sheet_file, pitch_notes FROM songs ORDER BY name;
SELECT s.name AS song, f.sort_order, f.name AS stemme, f.file FROM song_voice_files f JOIN songs s ON s.id = f.song_id ORDER BY s.name, f.sort_order;
