<?php
/* GET -> which setup step works. Open https://dev.armeriddere.no/api/health.php when the site shows
   "Noe gikk galt på serveren." It never shows passwords, user names or host names — only ok / a hint.

   {
     "config":   "ok" | "missing: upload private/config.php next to the dev folder",
     "database": "ok" | "cannot connect (error 1045 = wrong user or password, 2002/2005 = wrong host, 1044 = user has no access to this database name)",
     "tables":   21 (should be 21 after db/migrations/001_schema.sql),
     "members":  number of members (0 = run 002_start_data.sql),
     "storage":  "ok" | "missing: ..."
   } */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
ini_set('display_errors', '0');

$result = [];
$path = getenv('RIDDER_CONFIG') ?: __DIR__ . '/../../private/config.php';
if (!is_file($path)) {
  echo json_encode(['config' => 'missing: upload private/config.php next to the dev folder'], JSON_UNESCAPED_UNICODE);
  exit;
}
$config = require $path;
$result['config'] = 'ok';

try {
  $db = $config['db'];
  $pdo = new PDO("mysql:host={$db['host']};dbname={$db['name']};charset=utf8mb4", $db['user'], $db['password'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_TIMEOUT => 5,
  ]);
  $result['database'] = 'ok';
  $result['tables'] = (int) $pdo->query('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()')->fetchColumn();
  try {
    $result['members'] = (int) $pdo->query('SELECT COUNT(*) FROM members')->fetchColumn();
  } catch (Throwable $error) {
    $result['members'] = 'no members table: run db/migrations/001_schema.sql';
  }
} catch (Throwable $error) {
  $code = $error instanceof PDOException ? ($error->errorInfo[1] ?? $error->getCode()) : 0;
  $result['database'] = "cannot connect (error $code: 1045 = wrong user or password, 2002/2005 = wrong host, 1044/1049 = wrong database name or no access)";
}

$storage = $config['storage_dir'] ?? '';
$result['storage'] = is_dir($storage) ? 'ok' : 'missing: upload the storage folder next to the dev folder';

echo json_encode($result, JSON_UNESCAPED_UNICODE);
