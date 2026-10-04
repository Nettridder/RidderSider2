<?php
/* Login state, stored in the database (table auth_tokens) — no PHP sessions.

   Why: PHP sessions on shared hosting are deleted after ~24 minutes idle (session.gc_maxlifetime),
   which threw members out. Here the browser holds a random token in an HttpOnly cookie, the database
   holds only its SHA-256 hash, and the token stays valid for 90 days from last use.

   Endpoints use:
     $me = require_login();          // 401 if not logged in
     require_role($me, 'noteadmin'); // 403 without the role ('admin' and owner pass every role) */

declare(strict_types=1);

const AUTH_COOKIE = 'rs_token';
const LOGIN_DAYS = 90;
const RESET_MINUTES = 60;

/* Columns of members that are never sent to the browser. */
const MEMBER_SECRET_COLUMNS = ['password_hash'];

function new_token(): string
{
  return bin2hex(random_bytes(32));
}

function token_hash(string $token): string
{
  return hash('sha256', $token);
}

function set_auth_cookie(string $token, int $expiresAt): void
{
  setcookie(AUTH_COOKIE, $token, [
    'expires' => $expiresAt,
    'path' => '/',
    'secure' => config('cookie_secure'),
    'httponly' => true,     // JavaScript can never read the token
    'samesite' => 'Lax',
  ]);
}

/* Creates a login token for the member and sends it as a cookie. */
function start_login(int $memberId): void
{
  $token = new_token();
  $expiresAt = time() + LOGIN_DAYS * 86400;
  query(
    'INSERT INTO auth_tokens (member_id, purpose, token_hash, expires_at, user_agent) VALUES (?, \'login\', ?, FROM_UNIXTIME(?), ?)',
    [$memberId, token_hash($token), $expiresAt, substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255)]
  );
  set_auth_cookie($token, $expiresAt);
}

/* Ends this browser's login. */
function end_login(): void
{
  if (!empty($_COOKIE[AUTH_COOKIE])) {
    query('DELETE FROM auth_tokens WHERE purpose = \'login\' AND token_hash = ?', [token_hash($_COOKIE[AUTH_COOKIE])]);
  }
  set_auth_cookie('', time() - 3600);
}

/* Logs the member out on every device and cancels open reset links. Used after a password change. */
function end_all_logins(int $memberId): void
{
  query('DELETE FROM auth_tokens WHERE member_id = ?', [$memberId]);
}

/* Members row as the browser may see it: no secret columns, roles as an array, flags as booleans. */
function member_for_client(array $member): array
{
  foreach (MEMBER_SECRET_COLUMNS as $column) unset($member[$column]);
  $member = row_for_client($member);
  $member['roles'] = $member['roles'] ?? [];
  return $member;
}

/* The logged-in member, or null. Slides the expiry forward at most once a day. */
function current_member(): ?array
{
  static $member = false;
  if ($member !== false) return $member;
  $member = null;

  $token = $_COOKIE[AUTH_COOKIE] ?? '';
  if (!is_string($token) || !preg_match('/^[0-9a-f]{64}$/', $token)) return null;

  $row = query(
    'SELECT t.id AS token_id, UNIX_TIMESTAMP(t.expires_at) AS token_expires, m.*
     FROM auth_tokens t JOIN members m ON m.id = t.member_id
     WHERE t.purpose = \'login\' AND t.token_hash = ? AND t.expires_at > NOW()',
    [token_hash($token)]
  )->fetch();
  if (!$row) return null;

  $fullExpiry = time() + LOGIN_DAYS * 86400;
  if ($fullExpiry - (int) $row['token_expires'] > 86400) {
    query('UPDATE auth_tokens SET expires_at = FROM_UNIXTIME(?) WHERE id = ?', [$fullExpiry, $row['token_id']]);
    set_auth_cookie($token, $fullExpiry);
  }
  if (random_int(1, 50) === 1) delete_expired_auth_rows();

  unset($row['token_id'], $row['token_expires']);
  return $member = member_for_client($row);
}

/* Housekeeping, run now and then by current_member() instead of a cron job. */
function delete_expired_auth_rows(): void
{
  query('DELETE FROM auth_tokens WHERE expires_at < NOW()');
  query('DELETE FROM auth_attempts WHERE created_at < NOW() - INTERVAL 1 DAY');
}

function require_login(): array
{
  $member = current_member();
  if (!$member) json_error(401, 'Du er ikke logget inn.');
  return $member;
}

/* Same rule as hasRole() in app/js/global.js: owner and 'admin' have every role.
   Roles in members.roles: 'admin' = Admin, 'noteadmin' = Note Admin. */
function has_role(array $member, string $role): bool
{
  return !empty($member['is_owner'])
    || in_array('admin', $member['roles'], true)
    || in_array($role, $member['roles'], true);
}

function require_role(array $member, string $role): void
{
  if (!has_role($member, $role)) json_error(403, 'Du har ikke tilgang til dette.');
}
