<?php
/* TEMPLATE for ~/private/config.php on the server (one level ABOVE the dev/ folder, never inside it).

   Copy this file, fill in the real values and upload it with FileZilla to ~/private/config.php.
   Never commit the real file to git. The API reads it from api/_lib/core.php. */

return [
  // Domeneshop control panel -> Databases. Use a database user that only has access to this database.
  'db' => [
    'host' => 'localhost',
    'name' => 'CHANGE_ME_dev_database',
    'user' => 'CHANGE_ME_dev_user',
    'password' => 'CHANGE_ME',
  ],

  // Absolute path to the media folder (outside the web root). Ask Domeneshop/FileZilla for the home path.
  'storage_dir' => '/home/CHANGE_ME/storage',

  // Used in links in emails (password reset).
  'site_url' => 'https://dev.armeriddere.no',

  // false only for local testing on http://localhost. Must be true on the server (HTTPS).
  'cookie_secure' => true,

  'mail' => [
    'from' => 'nettridder@armeriddere.no',
    'from_name' => 'Mannskoret Arme Riddere',
    // Where the contact and booking forms are sent (Rittmester's fixed address).
    'contact_to' => 'CHANGE_ME@armeriddere.no',
    // true = write mail to the PHP error log instead of sending (testing only).
    'log_only' => false,
  ],
];
