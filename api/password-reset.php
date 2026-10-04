<?php
/* POST {token, password} -> sets the new password from a reset link, then logs the member in.
   The link works once, for 1 hour. Afterwards every other login of the member is ended. */

require __DIR__ . '/_lib/core.php';
require __DIR__ . '/_lib/auth.php';

const MIN_PASSWORD_LENGTH = 8;

require_method('POST');
$body = json_body();
$token = (string) ($body['token'] ?? '');
$password = (string) ($body['password'] ?? '');

if (mb_strlen($password) < MIN_PASSWORD_LENGTH) {
  json_error(400, 'Passordet må ha minst ' . MIN_PASSWORD_LENGTH . ' tegn.');
}

$memberId = preg_match('/^[0-9a-f]{64}$/', $token) ? query(
  'SELECT member_id FROM auth_tokens WHERE purpose = \'reset\' AND token_hash = ? AND expires_at > NOW()',
  [token_hash($token)]
)->fetchColumn() : false;
if (!$memberId) json_error(400, 'Lenken er utløpt eller allerede brukt. Be om en ny lenke.');

db()->beginTransaction();
query('UPDATE members SET password_hash = ?, updated_by = ? WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $memberId, $memberId]);
end_all_logins((int) $memberId);   // also deletes this reset token
db()->commit();

start_login((int) $memberId);
json_out(['ok' => true]);
