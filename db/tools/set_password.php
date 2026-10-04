<?php
/* Makes the SQL line that sets a member's password, for when "Glemt passord" email doesn't work yet.

   Run on your own computer (not on the server):
       php www/db/tools/set_password.php                      (for kristianhafell@gmail.com)
       php www/db/tools/set_password.php someone@example.no   (for another member)
   Type the password twice (it isn't shown). Then paste the printed lines in the Domeneshop database
   browser (SQL) and run them. Put your dev database name on the USE line first.

   Only the hash (scrambled form) of the password is printed and stored, never the password itself. */

if (PHP_SAPI !== 'cli') exit("Run this from the terminal.\n");

$email = strtolower(trim($argv[1] ?? 'kristianhafell@gmail.com'));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) exit("Not a valid email address: $email\n");

function ask_hidden(string $prompt): string
{
  echo $prompt;
  $hide = stripos(PHP_OS, 'WIN') !== 0;
  if ($hide) shell_exec('stty -echo');
  $answer = rtrim((string) fgets(STDIN), "\r\n");
  if ($hide) { shell_exec('stty echo'); echo "\n"; }
  return $answer;
}

$password = ask_hidden("New password for $email (at least 8 characters): ");
if (mb_strlen($password) < 8) exit("Too short — at least 8 characters.\n");
if (ask_hidden('Type it again: ') !== $password) exit("The two passwords are not the same.\n");

$hash = password_hash($password, PASSWORD_DEFAULT);
echo "\nPut your dev database name on the USE line, then paste both lines in the database browser (SQL):\n\n";
echo "USE `CHANGE_ME_dev_database`;\n";
echo "UPDATE members SET password_hash = '$hash' WHERE email = '$email';\n\n";
echo "Then log in on /app/logg-inn.html with $email and the password you just typed.\n";
