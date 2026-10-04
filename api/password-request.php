<?php
/* POST {email} -> emails a one-time link for setting a new password ("Glemt passord").

   Also how NEW members get in: an admin creates the member without a usable password,
   and the member uses this form to choose one.
   Always gives the same answer, whether or not the email belongs to a member. */

require __DIR__ . '/_lib/core.php';
require __DIR__ . '/_lib/auth.php';
require __DIR__ . '/_lib/mail.php';

require_method('POST');
$email = mb_strtolower(trim((string) (json_body()['email'] ?? '')));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_error(400, 'Skriv inn en gyldig e-postadresse.');

$answer = ['message' => 'Hvis e-posten finnes hos oss, har vi sendt en lenke for å sette nytt passord. Lenken virker i 1 time.'];

if (too_many_attempts('reset', $email, 3, 20, 60)) json_out($answer);
record_attempt('reset', $email);

$member = query('SELECT id, first_name FROM members WHERE email = ?', [$email])->fetch();
if (!$member) json_out($answer);

// Only the newest link works.
query('DELETE FROM auth_tokens WHERE member_id = ? AND purpose = \'reset\'', [$member['id']]);
$token = new_token();
query(
  'INSERT INTO auth_tokens (member_id, purpose, token_hash, expires_at) VALUES (?, \'reset\', ?, NOW() + INTERVAL ? MINUTE)',
  [$member['id'], token_hash($token), RESET_MINUTES]
);

$link = rtrim(config('site_url'), '/') . '/app/nytt-passord.html?token=' . $token;
send_mail(
  $email,
  'Sett nytt passord – Arme Riddere',
  "Hei {$member['first_name']}!\n\n"
  . "Noen (forhåpentligvis du) ba om å sette nytt passord for Arme Riddere-appen.\n\n"
  . "Åpne denne lenken for å velge passord. Den virker i 1 time og kan bare brukes én gang:\n$link\n\n"
  . "Ba du ikke om dette, kan du se bort fra e-posten. Passordet ditt er ikke endret."
);

json_out($answer);
