<?php
/* GET -> data for the public pages and the login page. No login needed, so only send what anyone may see.
   NEVER add email, phone, last_login or anything private here.

   {
     members:     active members with show_public = 1 (name, voice group, rank, image path),
     conductor_id: member id of the current board's dirigent (or null),
     login_backgrounds: image paths for the login page
   }
   (The carousel in the Book oss section has its own endpoint, api/carousel.php, which needs no database.) */

require __DIR__ . '/_lib/core.php';

require_method('GET');
header('Cache-Control: public, max-age=300');

$members = query(
  'SELECT id, first_name, last_name, voice_group, `rank`, image_file
   FROM members WHERE status = \'active\' AND show_public = 1
   ORDER BY first_name, last_name'
)->fetchAll();

$conductorId = query('SELECT dirigent_id FROM boards ORDER BY year DESC, term DESC LIMIT 1')->fetchColumn();

$backgrounds = query('SELECT file FROM login_backgrounds WHERE is_active = 1')->fetchAll(PDO::FETCH_COLUMN);

json_out([
  'members' => $members,
  'conductor_id' => $conductorId ?: null,
  'login_backgrounds' => $backgrounds,
]);
