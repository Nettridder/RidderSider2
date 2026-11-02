<?php
/* The signed-in member's own marker drawing on a song's sheet music (experimental).

   GET  ?song_id=12                  -> {strokes: [...]}   (empty list when nothing is drawn)
   POST {song_id: 12, strokes: [...]} -> {ok: true}         saves the whole drawing; an empty list deletes it

   Always the signed-in member's own row: there is no way to ask for another member's drawing.
   A stroke is {p: page number (0 = first), pts: [x1, y1, x2, y2, ...]}, points as fractions of the page width. */

require __DIR__ . '/_lib/core.php';
require __DIR__ . '/_lib/auth.php';

const MAX_STROKES = 4000;
const MAX_POINTS_PER_STROKE = 6000;   // numbers, so 3000 points
const MAX_PAGES = 60;

$me = require_login();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  $songId = (int) ($_GET['song_id'] ?? 0);
  if ($songId < 1) json_error(400, 'Mangler sang.');
  $json = query('SELECT strokes FROM song_drawings WHERE member_id = ? AND song_id = ?', [$me['id'], $songId])->fetchColumn();
  json_out(['strokes' => $json ? json_decode($json, true) : []]);
}

require_method('POST');
$body = json_body();
$songId = (int) ($body['song_id'] ?? 0);
$strokes = $body['strokes'] ?? null;
if ($songId < 1 || !is_array($strokes) || count($strokes) > MAX_STROKES) json_error(400, 'Ugyldig tegning.');
if (!query('SELECT 1 FROM songs WHERE id = ?', [$songId])->fetchColumn()) json_error(404, 'Fant ikke sangen.');

/* Keep only well-formed strokes, with numbers rounded: never trust what the browser sends. */
$clean = [];
foreach ($strokes as $stroke) {
  $page = $stroke['p'] ?? null;
  $points = $stroke['pts'] ?? null;
  if (!is_int($page) || $page < 0 || $page >= MAX_PAGES || !is_array($points)) continue;
  $count = count($points);
  if ($count < 2 || $count % 2 !== 0 || $count > MAX_POINTS_PER_STROKE) continue;
  $numbers = [];
  foreach ($points as $number) {
    if (!is_int($number) && !is_float($number)) continue 2;
    $numbers[] = round(max(-0.5, min(2.0, (float) $number)), 4);
  }
  $clean[] = ['p' => $page, 'pts' => $numbers];
}

if (!$clean) {
  query('DELETE FROM song_drawings WHERE member_id = ? AND song_id = ?', [$me['id'], $songId]);
  json_out(['ok' => true]);
}

$json = json_encode($clean, JSON_UNESCAPED_UNICODE);
if (strlen($json) > 2_000_000) json_error(413, 'Tegningen er for stor.');
query(
  'INSERT INTO song_drawings (member_id, song_id, strokes) VALUES (?, ?, ?)
   ON DUPLICATE KEY UPDATE strokes = VALUES(strokes)',
  [$me['id'], $songId, $json]
);
json_out(['ok' => true]);
