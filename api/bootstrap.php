<?php
/* GET -> every table the logged-in member may see, in one response: {members: [...], songs: [...], ...}.

   The app loads this once per page and does all joins and filtering in JavaScript (Alpine store),
   exactly like it did with database.json. This file decides what is safe to send:
     - password_hash and the auth tables are never sent.
     - Secret songs (and their files, genres, knowledge rows) are only sent to members allowed to see
       them: active members when the song is in a visible repertoire, and the 'notes' role always.
     - Hidden repertoires are only sent to the 'notes' role. */

require __DIR__ . '/_lib/core.php';
require __DIR__ . '/_lib/auth.php';

require_method('GET');
$me = require_login();
$isNotes = has_role($me, 'notes');
$isActive = $me['status'] === 'active';

/* Same rule as canSeeSong() in app/js/global.js. */
$visibleSongs = $isNotes ? 'SELECT id FROM songs' : (
  'SELECT s.id FROM songs s WHERE s.is_secret = 0' . ($isActive ? '
     OR EXISTS (SELECT 1 FROM repertoire_songs rs JOIN repertoires r ON r.id = rs.repertoire_id
                WHERE rs.song_id = s.id AND r.is_visible = 1)' : '')
);

$tables = [
  'members' => 'SELECT * FROM members',
  'boards' => 'SELECT * FROM boards',
  'songs' => "SELECT * FROM songs WHERE id IN ($visibleSongs)",
  'song_voice_files' => "SELECT * FROM song_voice_files WHERE song_id IN ($visibleSongs)",
  'genres' => 'SELECT * FROM genres',
  'song_genres' => "SELECT * FROM song_genres WHERE song_id IN ($visibleSongs)",
  'member_songs' => "SELECT * FROM member_songs WHERE song_id IN ($visibleSongs)",
  'repertoires' => 'SELECT * FROM repertoires' . ($isNotes ? '' : ' WHERE is_visible = 1'),
  'repertoire_songs' => 'SELECT rs.* FROM repertoire_songs rs JOIN repertoires r ON r.id = rs.repertoire_id'
    . ($isNotes ? '' : " WHERE r.is_visible = 1 AND rs.song_id IN ($visibleSongs)"),
  'practice_plans' => 'SELECT * FROM practice_plans',
  'practice_logs' => 'SELECT * FROM practice_logs',
  'practice_competitions' => 'SELECT * FROM practice_competitions',
  'attendance' => 'SELECT * FROM attendance',
  'achievements' => 'SELECT * FROM achievements',
  'member_achievements' => 'SELECT * FROM member_achievements',
  'documents' => 'SELECT * FROM documents',
  'resolutions' => 'SELECT * FROM resolutions',
  'login_backgrounds' => 'SELECT * FROM login_backgrounds',
  'settings' => 'SELECT * FROM settings',
];

$data = [];
foreach ($tables as $table => $sql) {
  $toClient = $table === 'members' ? 'member_for_client' : 'row_for_client';
  $data[$table] = array_map($toClient, query($sql)->fetchAll());
}

json_out($data);
