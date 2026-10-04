<?php
/* Sends automated email from nettridder@armeriddere.no (config 'mail').

   Uses PHP's mail(), which Domeneshop's webhotel supports for addresses on our own domain.
   If mail starts landing in spam, swap the body of send_mail() for SMTP (e.g. PHPMailer) —
   nothing else needs to change. With 'log_only' => true in config, mail is written to the
   PHP error log instead of being sent (useful when testing). */

declare(strict_types=1);

const AUTOMATED_FOOTER = "\n\n--\nDenne e-posten er sendt automatisk fra armeriddere.no.\nHar du spørsmål, kan du svare på denne e-posten.";

/* Removes line breaks so user input can never add extra mail headers. */
function header_safe(string $text): string
{
  return trim(str_replace(["\r", "\n"], ' ', $text));
}

function send_mail(string $to, string $subject, string $body, ?string $replyTo = null, bool $automated = true): bool
{
  $mail = config('mail');
  $to = header_safe($to);
  if ($automated) $body .= AUTOMATED_FOOTER;

  if (!empty($mail['log_only'])) {
    error_log("[mail] To: $to | Subject: $subject\n$body");
    return true;
  }

  $from = $mail['from'];
  $headers = [
    'From' => mb_encode_mimeheader($mail['from_name'], 'UTF-8') . " <$from>",
    'Reply-To' => header_safe($replyTo ?: $from),
    'MIME-Version' => '1.0',
    'Content-Type' => 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding' => '8bit',
  ];
  return mail($to, mb_encode_mimeheader(header_safe($subject), 'UTF-8'), $body, $headers, '-f' . $from);
}
