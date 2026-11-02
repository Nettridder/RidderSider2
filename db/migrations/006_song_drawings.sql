-- 006_song_drawings.sql — each member's own marker drawing on a song's sheet music (experimental).
-- Run ONCE on a database made with the OLD 001_schema.sql. A database made with the current 001_schema.sql
-- already has the table: then skip this file. Safe to run twice.
-- Paste in the Domeneshop database browser (SQL) and run.
--
-- One row per member and song. `strokes` is JSON: [{"p": 0, "pts": [x1, y1, x2, y2, ...]}, ...]
--   p   = page number of the PDF (0 = first page)
--   pts = points as fractions of the page width (x and y both divided by the width), so it fits any screen size.
-- Nobody but the member reads or writes their row (api/drawing.php always uses the signed-in member).

USE `armeriddereno05`;

SET NAMES utf8mb4;

-- SAFETY: never run this in the old live site's database.
SET @STOP_this_is_the_live_database_choose_the_dev_database = IF(DATABASE() = 'armeriddere', (SELECT 1 UNION SELECT 2), 1);

CREATE TABLE IF NOT EXISTS song_drawings (
  id          int(11)    NOT NULL AUTO_INCREMENT,
  created_at  timestamp  NOT NULL DEFAULT current_timestamp(),
  updated_at  timestamp  NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  member_id   int(11)    NOT NULL,
  song_id     int(11)    NOT NULL,
  strokes     mediumtext NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_song_drawings_member_song (member_id, song_id),
  CONSTRAINT fk_song_drawings_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE,
  CONSTRAINT fk_song_drawings_song FOREIGN KEY (song_id) REFERENCES songs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT COUNT(*) AS drawings FROM song_drawings;
