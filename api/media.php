<?php
/* GET ?path=songs/audio/28_bass.mp3 -> streams a file from storage/ (outside the web root).

   - Login required, except for public images: images/public/* (public site pictures, carousel),
     images/backgrounds/* (login page), and images/profile/* of members shown on the public members page.
   - The path is checked so it can never leave storage/ (no "..", resolved with realpath).
   - Only known file types are served, with the right Content-Type.
   - Supports HTTP Range requests, which browsers need for seeking in audio and video. */

require __DIR__ . '/_lib/core.php';
require __DIR__ . '/_lib/auth.php';

const MEDIA_TYPES = [
  'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp', 'gif' => 'image/gif',
  'mp3' => 'audio/mpeg', 'm4a' => 'audio/mp4', 'wav' => 'audio/wav', 'ogg' => 'audio/ogg',
  'mp4' => 'video/mp4', 'webm' => 'video/webm',
  'pdf' => 'application/pdf',
  'doc' => 'application/msword',
  'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const DOWNLOAD_ONLY = ['doc', 'docx'];

require_method('GET');
$path = (string) ($_GET['path'] ?? '');

if ($path === '' || str_contains($path, "\0") || str_contains($path, '\\') || str_starts_with($path, '/')
    || in_array('..', explode('/', $path), true)) {
  json_error(400, 'Ugyldig filsti.');
}

$extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
if (!isset(MEDIA_TYPES[$extension])) json_error(404, 'Fant ikke filen.');

$root = realpath(config('storage_dir'));
$file = realpath($root . '/' . $path);
if (!$root || !$file || !str_starts_with($file, $root . DIRECTORY_SEPARATOR) || !is_file($file)) {
  json_error(404, 'Fant ikke filen.');
}

function is_public_media(string $path): bool
{
  if (str_starts_with($path, 'images/public/') || str_starts_with($path, 'images/backgrounds/')) return true;
  if (str_starts_with($path, 'images/profile/') && substr_count($path, '/') === 2) {
    return (bool) query(
      'SELECT 1 FROM members WHERE show_public = 1 AND image_file = ? LIMIT 1',   // current and former (public Medlemmer page)
      [basename($path)]
    )->fetchColumn();
  }
  return false;
}

$isPublic = is_public_media($path);
if (!$isPublic) require_login();

/* ---------- send the file (whole or one byte range) ---------- */

$size = filesize($file);
$start = 0;
$end = $size - 1;

if (isset($_SERVER['HTTP_RANGE'])) {
  if (!preg_match('/^bytes=(\d*)-(\d*)$/', $_SERVER['HTTP_RANGE'], $match) || ($match[1] === '' && $match[2] === '')) {
    header("Content-Range: bytes */$size");
    json_error(416, 'Ugyldig område.');
  }
  if ($match[1] === '') {                 // "bytes=-500" = the last 500 bytes
    $start = max(0, $size - (int) $match[2]);
  } else {
    $start = (int) $match[1];
    if ($match[2] !== '') $end = min((int) $match[2], $size - 1);
  }
  if ($start > $end || $start >= $size) {
    header("Content-Range: bytes */$size");
    json_error(416, 'Ugyldig område.');
  }
  http_response_code(206);
  header("Content-Range: bytes $start-$end/$size");
}

header('Content-Type: ' . MEDIA_TYPES[$extension]);
header('Content-Length: ' . ($end - $start + 1));
header('Accept-Ranges: bytes');
header('Cache-Control: ' . ($isPublic ? 'public, max-age=86400' : 'private, max-age=3600'));
header('Last-Modified: ' . gmdate('D, d M Y H:i:s', filemtime($file)) . ' GMT');
$disposition = in_array($extension, DOWNLOAD_ONLY, true) ? 'attachment' : 'inline';
header("Content-Disposition: $disposition; filename*=UTF-8''" . rawurlencode(basename($file)));

set_time_limit(0);
$handle = fopen($file, 'rb');
fseek($handle, $start);
$remaining = $end - $start + 1;
while ($remaining > 0 && !feof($handle) && !connection_aborted()) {
  $chunk = fread($handle, min(65536, $remaining));
  echo $chunk;
  flush();
  $remaining -= strlen($chunk);
}
fclose($handle);
