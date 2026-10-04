<?php
/* Shared start for every endpoint in api/: config, database connection and JSON helpers.

   Every endpoint starts with:  require __DIR__ . '/_lib/core.php';

   The secret config (DB password, mail, paths) lives OUTSIDE the web root in ~/private/config.php,
   never in git. Template: .info/config.example.php. For local testing, the env variable
   RIDDER_CONFIG can point to another config file. */

declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

/* Any uncaught error becomes a JSON 500 without leaking details. Details go to the PHP error log. */
set_exception_handler(function (Throwable $error) {
  error_log('[api] ' . $error);
  if (!headers_sent()) http_response_code(500);
  echo json_encode(['error' => 'Noe gikk galt på serveren.']);
});

function config(string $key)
{
  static $config = null;
  if ($config === null) {
    $path = getenv('RIDDER_CONFIG') ?: __DIR__ . '/../../../private/config.php';
    if (!is_file($path)) throw new RuntimeException("Config file missing: $path");
    $config = require $path;
  }
  if (!array_key_exists($key, $config)) throw new RuntimeException("Config key missing: $key");
  return $config[$key];
}

function db(): PDO
{
  static $pdo = null;
  if ($pdo === null) {
    $db = config('db');
    $pdo = new PDO(
      "mysql:host={$db['host']};dbname={$db['name']};charset=utf8mb4",
      $db['user'],
      $db['password'],
      [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,   // real prepared statements, and ints come back as ints
      ]
    );
    // Strict mode: a wrong value (bad enum, too long text) is an error instead of being silently changed.
    $pdo->exec("SET SESSION sql_mode = 'STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO'");
  }
  return $pdo;
}

/* Runs a prepared statement. Always use this (or db()->prepare) — never put user input into the SQL string. */
function query(string $sql, array $params = []): PDOStatement
{
  $statement = db()->prepare($sql);
  $statement->execute($params);
  return $statement;
}

/* Columns stored as JSON text in MariaDB. The browser sends and gets real arrays/values. */
const JSON_COLUMNS = ['roles', 'present_member_ids', 'value'];

/* A database row as the app expects it: JSON columns decoded, is_* / show_* flags as true/false.
   (members rows also go through member_for_client() in auth.php to remove secret columns.) */
function row_for_client(array $row): array
{
  foreach ($row as $column => $value) {
    if (in_array($column, JSON_COLUMNS, true) && is_string($value)) $row[$column] = json_decode($value, true);
    elseif (str_starts_with($column, 'is_') || str_starts_with($column, 'show_')) $row[$column] = (bool) $value;
  }
  return $row;
}

function json_out($data, int $status = 200): void
{
  http_response_code($status);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

/* $message is shown to the user, so write it in Norwegian. */
function json_error(int $status, string $message): void
{
  json_out(['error' => $message], $status);
}

function require_method(string $method): void
{
  if ($_SERVER['REQUEST_METHOD'] !== $method) json_error(405, 'Feil metode.');
}

/* Body of a POST with Content-Type: application/json, as an array. */
function json_body(): array
{
  $data = json_decode(file_get_contents('php://input') ?: '', true);
  return is_array($data) ? $data : [];
}

function client_ip(): string
{
  return substr($_SERVER['REMOTE_ADDR'] ?? '', 0, 45);
}

/* ---------- rate limiting (table auth_attempts) ---------- */

function record_attempt(string $kind, string $email): void
{
  query('INSERT INTO auth_attempts (kind, email, ip) VALUES (?, ?, ?)', [$kind, $email, client_ip()]);
}

/* True when this email or this IP has done $kind too often in the last $minutes. */
function too_many_attempts(string $kind, string $email, int $maxPerEmail, int $maxPerIp, int $minutes): bool
{
  $row = query(
    'SELECT SUM(email = ?) AS by_email, SUM(ip = ?) AS by_ip FROM auth_attempts
     WHERE kind = ? AND created_at > NOW() - INTERVAL ? MINUTE',
    [$email, client_ip(), $kind, $minutes]
  )->fetch();
  return (int) $row['by_email'] >= $maxPerEmail || (int) $row['by_ip'] >= $maxPerIp;
}

function clear_attempts(string $kind, string $email): void
{
  query('DELETE FROM auth_attempts WHERE kind = ? AND email = ?', [$kind, $email]);
}
