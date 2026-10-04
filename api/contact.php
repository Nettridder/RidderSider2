<?php
/* POST {name, email, subject, message, kind: 'contact'|'booking', website} -> emails the choir.
   Used by the two forms on index.html: Kontakt oss (kind 'contact') and Book oss (kind 'booking').
   Replaces the old contactform/contactform.php.

   'website' is a honeypot: a hidden field people never fill in, but spam bots do. */

require __DIR__ . '/_lib/core.php';
require __DIR__ . '/_lib/mail.php';

require_method('POST');
$body = json_body();
$field = fn(string $key, int $max) => mb_substr(trim((string) ($body[$key] ?? '')), 0, $max);

$name = $field('name', 100);
$email = $field('email', 255);
$subject = $field('subject', 150);
$message = $field('message', 5000);
$kind = ($body['kind'] ?? '') === 'booking' ? 'booking' : 'contact';

if (!empty($body['website'])) json_out(['ok' => true]);   // bot: pretend it worked
if (mb_strlen($name) < 2 || !filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($subject) < 4 || mb_strlen($message) < 10) {
  json_error(400, 'Fyll inn navn, gyldig e-post, emne (minst 4 tegn) og melding (minst 10 tegn).');
}
if (too_many_attempts('contact', $email, 5, 10, 60)) json_error(429, 'Du har sendt mange meldinger. Prøv igjen senere.');
record_attempt('contact', $email);

$label = $kind === 'booking' ? 'Booking' : 'Kontakt';
$sent = send_mail(
  config('mail')['contact_to'],
  "[$label] $subject",
  "Ny melding fra skjemaet på armeriddere.no ($label).\n\nFra: $name <$email>\nEmne: $subject\n\n$message",
  $email,
  false
);
if (!$sent) json_error(500, 'Meldingen kunne ikke sendes. Prøv igjen senere, eller send e-post direkte.');

json_out(['ok' => true]);
