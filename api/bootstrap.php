<?php
/* GET -> every table the logged-in member may see, in one response: {members: [...], songs: [...], ...}.

   The app loads this once per page and does all joins and filtering in JavaScript (Alpine store),
   exactly like it did with database.json. This file decides what is safe to send:
     - password_hash and the auth tables are never sent.
     - Repertoires: Note Admin ('noteadmin') gets all; active members the visible ones; former members (ypp.com.)
       only visible ones where "Skjult for ypp.com." (hidden_for_former) is off.
     - Secret songs (and their files, genres, knowledge rows) are only sent when the song is in a
       repertoire this member gets (see above), and to Note Admin always. */

require __DIR__ . '/_lib/core.php';
require __DIR__ . '/_lib/auth.php';

require_method('GET');
$me = require_login();
$isNoteAdmin = has_role($me, 'noteadmin');
$isActive = $me['status'] === 'active';

/* Which repertoires this member gets. Same rule as visibleRepertoires in app/js/global.js. */
$myRepertoires = $isNoteAdmin ? 'TRUE' : ($isActive ? 'r.is_visible = 1' : 'r.is_visible = 1 AND r.hidden_for_former = 0');

/* Same rule as canSeeSong() in app/js/global.js. */
$visibleSongs = $isNoteAdmin ? 'SELECT id FROM songs' : (
  "SELECT s.id FROM songs s WHERE s.is_secret = 0
     OR EXISTS (SELECT 1 FROM repertoire_songs rs JOIN repertoires r ON r.id = rs.repertoire_id
                WHERE rs.song_id = s.id AND $myRepertoires)"
);

$tables = [
  'members' => 'SELECT * FROM members',
  'boards' => 'SELECT * FROM boards',
  'songs' => "SELECT * FROM songs WHERE id IN ($visibleSongs)",
  'song_voice_files' => "SELECT * FROM song_voice_files WHERE song_id IN ($visibleSongs)",
  'genres' => 'SELECT * FROM genres',
  'song_genres' => "SELECT * FROM song_genres WHERE song_id IN ($visibleSongs)",
  'member_songs' => "SELECT * FROM member_songs WHERE song_id IN ($visibleSongs)",
  'repertoires' => "SELECT r.* FROM repertoires r WHERE $myRepertoires",
  'repertoire_songs' => "SELECT rs.* FROM repertoire_songs rs JOIN repertoires r ON r.id = rs.repertoire_id
                         WHERE $myRepertoires AND rs.song_id IN ($visibleSongs)",
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
