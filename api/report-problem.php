<?php
/* POST {message, page} -> emails nettridder@armeriddere.no about a problem on the website, from the signed-in member.
   Used by the box at the bottom of Profil. The subject is fixed ("App: feil med bruker <name>").

   The mail itself is sent from the site's own address (mail only goes out from armeriddere.no), with the member's
   address as Reply-To, so Nettridder can answer straight to them. The body says who it is from. */

require __DIR__ . '/_lib/core.php';
require __DIR__ . '/_lib/auth.php';
require __DIR__ . '/_lib/mail.php';

const REPORT_TO = 'nettridder@armeriddere.no';

require_method('POST');
$me = require_login();
$body = json_body();

$message = mb_substr(trim((string) ($body['message'] ?? '')), 0, 5000);
$page = mb_substr(trim((string) ($body['page'] ?? '')), 0, 500);
if (mb_strlen($message) < 5) json_error(400, 'Skriv hva som er galt (minst 5 tegn).');

if (too_many_attempts('contact', $me['email'], 5, 10, 60)) json_error(429, 'Du har sendt mange meldinger. Prøv igjen senere.');
record_attempt('contact', $me['email']);

$name = trim($me['first_name'] . ' ' . $me['last_name']);
$userAgent = mb_substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 300);
$sent = send_mail(
  REPORT_TO,
  "App: feil med bruker $name",
  "Melding om feil på nettsiden.\n\nFra: $name <{$me['email']}> (medlem nr. {$me['id']})\nSide: $page\nNettleser: $userAgent\n\n$message",
  $me['email'],
  false
);
if (!$sent) json_error(500, 'Meldingen kunne ikke sendes. Prøv igjen senere.');

json_out(['ok' => true]);
