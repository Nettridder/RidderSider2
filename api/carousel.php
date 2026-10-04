<?php
/* GET -> ["/images/carousel/a.jpg", ...] for the carousel in the Book oss section of index.html.

   Lists every image in www/images/carousel/ (sorted by name). Deliberately uses no database and no
   config, so the carousel works even when the database is down or not set up yet.
   Keep the images web-sized (about 1600 px wide, under 600 KB): they are in git and every visitor downloads them. */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300');
header('X-Content-Type-Options: nosniff');

$files = glob(__DIR__ . '/../images/carousel/*.{jpg,jpeg,png,webp,gif,JPG,JPEG,PNG,WEBP}', GLOB_BRACE) ?: [];
sort($files);

echo json_encode(array_map(fn($file) => '/images/carousel/' . rawurlencode(basename($file)), $files));
