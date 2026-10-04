<?php
/* POST {email, password} -> {member} and sets the login cookie.
   Only members created by an admin can log in. Same error for wrong email and wrong password,
   so the form can't be used to find out who is a member. */

require __DIR__ . '/_lib/core.php';
require __DIR__ . '/_lib/auth.php';

require_method('POST');
$body = json_body();
$email = mb_strtolower(trim((string) ($body['email'] ?? '')));
$password = (string) ($body['password'] ?? '');

if ($email === '' || $password === '') json_error(400, 'Fyll inn e-post og passord.');
if (too_many_attempts('login', $email, 5, 30, 15)) {
  json_error(429, 'For mange forsøk. Vent et kvarter og prøv igjen.');
}

$member = query('SELECT * FROM members WHERE email = ?', [$email])->fetch();

// Run password_verify even for unknown emails, so the response time doesn't reveal members.
$hash = $member['password_hash'] ?? '$2y$12$NOkIwHdVhmkvcb7vEBpHu.G94Znzx9eHJK9f58OLxfJNvoeFZNFrm';
if (!$member || !$member['password_hash'] || !password_verify($password, $hash)) {
  record_attempt('login', $email);
  json_error(401, 'Feil e-post eller passord.');
}

if (password_needs_rehash($member['password_hash'], PASSWORD_DEFAULT)) {
  query('UPDATE members SET password_hash = ? WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $member['id']]);
}
query('UPDATE members SET last_login = NOW() WHERE id = ?', [$member['id']]);
clear_attempts('login', $email);
start_login((int) $member['id']);

json_out(['member' => member_for_client($member)]);
