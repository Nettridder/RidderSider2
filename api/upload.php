<?php
/* POST (multipart/form-data) -> stores an uploaded file in storage/ and saves it in the database in one step.

   Fields:
     kind=profile     file=<image>  member_id=12      -> storage/images/profile/,     sets members.image_file
     kind=background  file=<image>                    -> storage/images/backgrounds/, adds a login_backgrounds row (switched on)
     kind=document    file=<PDF/Word>  title=...      -> storage/documents/,          adds a documents row
     kind=document    file=<PDF/Word>  document_id=7  -> storage/documents/,          replaces the file of document 7
   Response:
     profile:              {member: {...the member as the browser sees it...}}
     background, document: {row: {...the saved row...}}

   Who may upload:
     profile              Admin (any member), or a member for themself
     background, document Admin
   Safety: the file must really be what it claims (checked from its content, not its name):
     images JPG, PNG or WebP, max 15 MB; documents PDF, DOCX or DOC, max 30 MB.
   It gets a new, safe file name (the original name cleaned + a random part), so nothing is ever overwritten.
   Database columns that hold file names are not writable through save.php, so files only change here.
   The app calls this from app/js/global.js: $store.app.upload(kind, file, extra). */

require __DIR__ . '/_lib/core.php';
require __DIR__ . '/_lib/auth.php';

const UPLOAD_FOLDERS = ['profile' => 'images/profile', 'background' => 'images/backgrounds', 'document' => 'documents'];
/* Content type found by finfo -> extension the file gets. Word files are reported in several ways. */
const IMAGE_TYPES = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
const DOCUMENT_TYPES = [
  'application/pdf' => 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
  'application/zip' => 'docx',              // a .docx is a zip file; only accepted when the name ends in .docx
  'application/msword' => 'doc',
  'application/x-ole-storage' => 'doc',
  'application/CDFV2' => 'doc',
];
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 30 * 1024 * 1024;

require_method('POST');
$me = require_login();

$kind = (string) ($_POST['kind'] ?? '');
if (!isset(UPLOAD_FOLDERS[$kind])) json_error(400, 'Ukjent type opplasting.');

/* ---------- 1. Who may do this ---------- */

$memberId = null;
$documentId = null;
$title = '';
if ($kind === 'profile') {
  $memberId = (int) ($_POST['member_id'] ?? 0);
  if ($memberId !== $me['id']) require_role($me, 'admin');
  if (!query('SELECT 1 FROM members WHERE id = ?', [$memberId])->fetchColumn()) json_error(404, 'Fant ikke medlemmet.');
} else {
  require_role($me, 'admin');
}
if ($kind === 'document') {
  $documentId = (int) ($_POST['document_id'] ?? 0) ?: null;
  $title = trim((string) ($_POST['title'] ?? ''));
  if ($documentId && !query('SELECT 1 FROM documents WHERE id = ?', [$documentId])->fetchColumn()) json_error(404, 'Fant ikke dokumentet. Last siden på nytt.');
  if (!$documentId && $title === '') json_error(400, 'Gi dokumentet en tittel.');
  if (mb_strlen($title) > 255) json_error(400, 'Tittelen er for lang.');
}

/* ---------- 2. Check the file ---------- */

$isDocument = $kind === 'document';
$maxBytes = $isDocument ? MAX_DOCUMENT_BYTES : MAX_IMAGE_BYTES;
$upload = $_FILES['file'] ?? null;
if (!$upload || is_array($upload['error']) || $upload['error'] === UPLOAD_ERR_NO_FILE) {
  json_error(400, $isDocument ? 'Velg en fil å laste opp.' : 'Velg et bilde å laste opp.');
}
if (in_array($upload['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) || $upload['size'] > $maxBytes) {
  json_error(413, $isDocument ? 'Filen er for stor. Maks 30 MB.' : 'Bildet er for stort. Maks 15 MB.');
}
if ($upload['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($upload['tmp_name'])) json_error(400, 'Opplastingen feilet. Prøv igjen.');

$type = (new finfo(FILEINFO_MIME_TYPE))->file($upload['tmp_name']);
$nameExtension = strtolower(pathinfo((string) $upload['name'], PATHINFO_EXTENSION));
if ($isDocument) {
  $extension = DOCUMENT_TYPES[$type] ?? null;
  // Word files must also be named like one, so a random zip or Office file is not taken as a Word document.
  if (!$extension || ($extension !== 'pdf' && $nameExtension !== $extension)) json_error(400, 'Filen må være PDF eller Word (.docx eller .doc).');
} else {
  $extension = IMAGE_TYPES[$type] ?? null;
  if (!$extension || !getimagesize($upload['tmp_name'])) json_error(400, 'Filen må være et bilde (JPG, PNG eller WebP).');
}

/* "Ola Nordmann (2).JPG" -> "ola-nordmann-2-3f9a1c.jpg" */
$base = strtolower(pathinfo((string) $upload['name'], PATHINFO_FILENAME));
$base = strtr($base, ['æ' => 'ae', 'ø' => 'o', 'å' => 'a', 'é' => 'e', 'ü' => 'u', 'ö' => 'o', 'ä' => 'a']);
$base = trim(preg_replace('/[^a-z0-9]+/', '-', $base), '-') ?: ($isDocument ? 'dokument' : 'bilde');
$fileName = substr($base, 0, 80) . '-' . bin2hex(random_bytes(3)) . '.' . $extension;

/* ---------- 3. Store it ---------- */

$folder = rtrim(config('storage_dir'), '/') . '/' . UPLOAD_FOLDERS[$kind];
if (!is_dir($folder) && !mkdir($folder, 0755, true)) throw new RuntimeException("Cannot create $folder");
$target = $folder . '/' . $fileName;
if (!move_uploaded_file($upload['tmp_name'], $target)) throw new RuntimeException("Cannot move upload to $target");
chmod($target, 0644);

/* ---------- 4. Save it in the database (the file is removed again if this fails) ---------- */

try {
  if ($kind === 'profile') {
    query('UPDATE members SET image_file = ?, updated_by = ? WHERE id = ?', [$fileName, $me['id'], $memberId]);
    json_out(['member' => member_for_client(query('SELECT * FROM members WHERE id = ?', [$memberId])->fetch())]);
  }
  if ($isDocument) {
    $path = UPLOAD_FOLDERS['document'] . '/' . $fileName;   // documents.file holds the path inside storage/
    if ($documentId) {
      query('UPDATE documents SET file = ?, updated_by = ? WHERE id = ?', [$path, $me['id'], $documentId]);
    } else {
      query('INSERT INTO documents (created_by, updated_by, title, file) VALUES (?, ?, ?, ?)', [$me['id'], $me['id'], $title, $path]);
      $documentId = (int) db()->lastInsertId();
    }
    json_out(['row' => row_for_client(query('SELECT * FROM documents WHERE id = ?', [$documentId])->fetch())]);
  }
  query(
    'INSERT INTO login_backgrounds (created_by, updated_by, file, is_active) VALUES (?, ?, ?, 1)',
    [$me['id'], $me['id'], $fileName]
  );
  $id = (int) db()->lastInsertId();
  json_out(['row' => row_for_client(query('SELECT * FROM login_backgrounds WHERE id = ?', [$id])->fetch())]);
} catch (Throwable $error) {
  @unlink($target);
  throw $error;
}
