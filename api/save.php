<?php
/* POST -> creates, changes or deletes one row (plus its children), if WRITE_RULES in _lib/permissions.php allow it.

   Request:
     {action: 'insert', table: 'songs', fields: {name: 'Bergensiana', ...}, children: {song_genres: [{genre_id: 3}], ...}}
     {action: 'update', table: 'songs', id: 12, fields: {...}, children: {...}}     children are optional
     {action: 'delete', table: 'songs', id: 12}
   Response:
     {row: {...saved row as stored...}, children: {song_genres: {fk: 'song_id', rows: [...]}, ...}}   row is null after delete

   The app calls this through $store.app.save() / $store.app.remove() in app/js/global.js.
   Everything is checked here: table, action, role, row owner and columns. The browser is never trusted. */

require __DIR__ . '/_lib/core.php';
require __DIR__ . '/_lib/auth.php';
require __DIR__ . '/_lib/permissions.php';

require_method('POST');
$me = require_login();
$body = json_body();

$action = $body['action'] ?? '';
$table = $body['table'] ?? '';
$id = isset($body['id']) ? (int) $body['id'] : null;
$fields = $body['fields'] ?? [];
$children = $body['children'] ?? [];

if (!in_array($action, ALL_OPS, true)) json_error(400, 'Ukjent handling.');
if (!is_string($table) || !isset(WRITE_RULES[$table])) json_error(400, 'Denne tabellen kan ikke endres.');
if (!is_array($fields) || !is_array($children)) json_error(400, 'Ugyldige data.');
if ($action !== 'insert' && !$id) json_error(400, 'Mangler id.');

$config = WRITE_RULES[$table];
$owner = $config['owner'] ?? null;

$existing = null;
if ($action !== 'insert') {
  $existing = query("SELECT * FROM `$table` WHERE id = ?", [$id])->fetch();
  if (!$existing) json_error(404, 'Fant ikke raden. Last siden på nytt.');
}

/* ---------- 1. Find the rule that allows this ---------- */

function rule_fits(array $rule, string $role, string $action, array $me, ?array $existing, array $fields, ?string $owner): bool
{
  if (!in_array($action, $rule['ops'], true)) return false;
  if ($role === 'self') {
    if (!$owner) return false;
    if ($existing && (int) $existing[$owner] !== $me['id']) return false;
  } elseif (!has_role($me, $role)) {
    return false;
  }
  $merged = array_merge($existing ?? [], $fields);
  foreach ($rule['only'] ?? [] as $column => $allowed) {
    if (!in_array($merged[$column] ?? null, $allowed, true)) return false;
  }
  return true;
}

$rule = null;
$ruleRole = null;
foreach ($config['rules'] as $role => $candidate) {
  if (rule_fits($candidate, $role, $action, $me, $existing, $fields, $owner)) {
    $rule = $candidate;
    $ruleRole = $role;
    break;
  }
}
if (!$rule) json_error(403, 'Du har ikke tilgang til å gjøre dette.');

/* ---------- 2. Check columns and turn values into what MariaDB stores ---------- */

if ($action === 'delete') {
  $fields = [];
  $children = [];
}

function clean_values(array $values, array $allowedColumns): array
{
  $clean = [];
  foreach ($values as $column => $value) {
    if (!in_array($column, $allowedColumns, true)) json_error(400, "Feltet «{$column}» kan ikke endres her.");
    if (in_array($column, JSON_COLUMNS, true)) $value = json_encode($value, JSON_UNESCAPED_UNICODE);
    elseif (is_bool($value)) $value = (int) $value;
    elseif (is_array($value)) json_error(400, "Ugyldig verdi i «{$column}».");
    elseif (is_string($value)) $value = trim($value);
    $clean[$column] = $value;
  }
  return $clean;
}

$values = clean_values($fields, $rule['columns']);
if ($action === 'update' && !$values && !$children) json_error(400, 'Ingenting å lagre.');

$childValues = [];
foreach ($children as $childTable => $rows) {
  $childRule = $rule['children'][$childTable] ?? null;
  if (!$childRule || !is_array($rows)) json_error(400, "«{$childTable}» kan ikke lagres sammen med denne raden.");
  $childValues[$childTable] = array_map(
    fn($row) => is_array($row) ? clean_values($row, $childRule['columns']) : json_error(400, 'Ugyldige data.'),
    array_values($rows)
  );
}

/* On insert, 'self' rows always belong to the logged-in member. */
if ($action === 'insert' && $ruleRole === 'self') $values[$owner] = $me['id'];

/* ---------- 3. Extra rules for single tables ---------- */

if ($table === 'members') check_member_change($action, $values, $existing, $me);
if ($table === 'attendance' && isset($fields['present_member_ids'])) {
  $ids = $fields['present_member_ids'];
  if (!is_array($ids) || array_filter($ids, fn($memberId) => !is_int($memberId))) json_error(400, 'Ugyldig liste over oppmøte.');
}

function check_member_change(string $action, array &$values, ?array $existing, array $me): void
{
  if (isset($values['email'])) {
    $values['email'] = mb_strtolower($values['email']);
    if (!filter_var($values['email'], FILTER_VALIDATE_EMAIL)) json_error(400, 'Skriv inn en gyldig e-postadresse.');
  }
  if (isset($values['roles'])) {
    $roles = json_decode($values['roles'], true);
    if (!is_array($roles) || array_diff($roles, ROLE_KEYS)) json_error(400, 'Ukjent rolle.');
    $values['roles'] = json_encode(array_values(array_unique($roles)));
  }
  if ($action === 'insert') {
    // Nobody knows this password. The new member chooses one with "Glemt passord".
    $values['password_hash'] = password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT);
    return;
  }

  $isSelf = (int) $existing['id'] === $me['id'];
  if ($existing['is_owner'] && !$isSelf && ($action === 'delete' || isset($values['email']))) {
    json_error(403, 'Eierens konto kan bare endres av eieren selv.');
  }
  if ($action === 'delete' && $isSelf) json_error(409, 'Du kan ikke fjerne deg selv.');

  $wasAdmin = in_array('admin', json_decode($existing['roles'], true) ?: [], true);
  $staysAdmin = $action === 'update' && in_array('admin', json_decode($values['roles'] ?? $existing['roles'], true) ?: [], true);
  if ($wasAdmin && !$staysAdmin) {
    $admins = (int) query('SELECT COUNT(*) FROM members WHERE JSON_CONTAINS(roles, \'"admin"\')')->fetchColumn();
    if ($admins <= 1) json_error(409, 'Dette er den siste med rollen Admin. Gi rollen til noen andre først.');
  }
}

/* ---------- 4. Write, in one transaction ---------- */

function insert_row(string $table, array $values, int $by): int
{
  $values += ['created_by' => $by, 'updated_by' => $by];
  $columns = implode(', ', array_map(fn($column) => "`$column`", array_keys($values)));
  $marks = implode(', ', array_fill(0, count($values), '?'));
  query("INSERT INTO `$table` ($columns) VALUES ($marks)", array_values($values));
  return (int) db()->lastInsertId();
}

/* Turns a database error into a message the member understands. */
function database_error_message(PDOException $error): ?string
{
  $code = $error->errorInfo[1] ?? 0;
  if ($code === 1062) return 'Dette finnes allerede.';
  if (in_array($code, [1451, 1452], true)) return 'Koblingen peker på noe som ikke finnes. Last siden på nytt.';
  if (in_array($code, [1048, 1364], true)) return 'Et påkrevd felt mangler.';
  if (in_array($code, [1265, 1292, 1366, 1406, 3819, 4025], true)) return 'Et av feltene har en ugyldig verdi.';
  return null;
}

try {
  db()->beginTransaction();
  if ($action === 'insert') {
    $id = insert_row($table, $values, $me['id']);
  } elseif ($action === 'update' && $values) {
    $values['updated_by'] = $me['id'];
    $set = implode(', ', array_map(fn($column) => "`$column` = ?", array_keys($values)));
    query("UPDATE `$table` SET $set WHERE id = ?", [...array_values($values), $id]);
  } elseif ($action === 'delete') {
    query("DELETE FROM `$table` WHERE id = ?", [$id]);   // children go too (ON DELETE CASCADE)
  }

  foreach ($childValues as $childTable => $rows) {
    $fk = $rule['children'][$childTable]['fk'];
    query("DELETE FROM `$childTable` WHERE `$fk` = ?", [$id]);
    foreach ($rows as $row) insert_row($childTable, [$fk => $id] + $row, $me['id']);
  }
  db()->commit();
} catch (PDOException $error) {
  db()->rollBack();
  $message = database_error_message($error);
  if ($message === null) throw $error;
  json_error(400, $message);
}

/* ---------- 5. Send back what is now stored ---------- */

if ($action === 'delete') json_out(['row' => null, 'children' => []]);

$toClient = $table === 'members' ? 'member_for_client' : 'row_for_client';
$saved = $toClient(query("SELECT * FROM `$table` WHERE id = ?", [$id])->fetch());
$savedChildren = [];
foreach (array_keys($childValues) as $childTable) {
  $fk = $rule['children'][$childTable]['fk'];
  $savedChildren[$childTable] = [
    'fk' => $fk,
    'rows' => array_map('row_for_client', query("SELECT * FROM `$childTable` WHERE `$fk` = ? ORDER BY id", [$id])->fetchAll()),
  ];
}
json_out(['row' => $saved, 'children' => $savedChildren]);
