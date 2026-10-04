-- 010_import_old.sql — copies the songs from the old site into the new tables. Run ONCE.
--
-- Before running:
--   1. In the OLD database (armeriddere): Export these four tables as SQL:
--        Songar, Stemmefiler, Sjangrar, SongarSjangrar
--   2. In the NEW dev database (armeriddereno05): paste/run that export. The four old tables now exist here too
--      (only a copy — the live site is not touched).
--   3. Paste and run this file in the dev database.
--
-- How old maps to new (a straight copy, nothing to fix by hand):
--   Songar.ID / Namn / Songtekst / Hemmeleg           -> songs.id / name / lyrics / is_secret
--   Songar.Notefilnamn                                -> songs.sheet_file        (PDF in storage/songs/pdf/)
--   Songar.Koreografifilnamn                          -> songs.choreography_url  (web address or file in storage/songs/video/)
--   Stemmefiler.Song_ID / Stemme / Mp3filnamn         -> song_voice_files.song_id / name / file (sound in storage/songs/melody/)
--   Stemmefiler order                                 -> sort_order by old ID (Note Admin can change the order after)
--   Sjangrar.ID / Namn, SongarSjangrar                -> genres, song_genres
-- IDs are kept, so links between the tables stay right. Who created a row is not copied (old user IDs ≠ members).
--
-- Run again from scratch? First run:  DELETE FROM songs;  DELETE FROM genres;  (sound files and links go too)

USE `armeriddereno05`;

SET NAMES utf8mb4;

-- SAFETY: never in the old live site's database.
SET @STOP_this_is_the_live_database_choose_the_dev_database = IF(DATABASE() = 'armeriddere', (SELECT 1 UNION SELECT 2), 1);

INSERT INTO genres (id, name, sort_order)
SELECT ID, Namn, LEAST(ID, 127) FROM Sjangrar;

INSERT INTO songs (id, created_at, updated_at, name, lyrics, choreography_url, sheet_file, is_secret)
SELECT ID, Oppretta, Oppdatert, Namn, NULLIF(TRIM(Songtekst), ''), NULLIF(TRIM(Koreografifilnamn), ''),
       NULLIF(TRIM(Notefilnamn), ''), IFNULL(Hemmeleg, 0)
FROM Songar;

INSERT IGNORE INTO song_genres (song_id, genre_id)
SELECT Song_ID, Sjanger_ID FROM SongarSjangrar
WHERE Song_ID IN (SELECT ID FROM Songar) AND Sjanger_ID IN (SELECT ID FROM Sjangrar);

INSERT INTO song_voice_files (id, created_at, updated_at, song_id, name, file, sort_order)
SELECT ID, Oppretta, Oppdatert, Song_ID, TRIM(Stemme), TRIM(Mp3filnamn),
       ROW_NUMBER() OVER (PARTITION BY Song_ID ORDER BY ID)
FROM Stemmefiler
WHERE Song_ID IN (SELECT ID FROM Songar) AND TRIM(Mp3filnamn) <> '';

-- Shows how many came over
SELECT (SELECT COUNT(*) FROM songs) AS songs, (SELECT COUNT(*) FROM song_voice_files) AS sound_files,
       (SELECT COUNT(*) FROM songs WHERE sheet_file IS NOT NULL) AS with_pdf,
       (SELECT COUNT(*) FROM genres) AS genres, (SELECT COUNT(*) FROM song_genres) AS genre_links;

-- When everything looks right, the copied old tables can go (the live site still has its own):
-- DROP TABLE Songar, Stemmefiler, Sjangrar, SongarSjangrar;
