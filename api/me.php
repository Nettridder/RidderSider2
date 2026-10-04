<?php
/* GET -> {member} for the logged-in member, or 401.
   The app calls this on page load and when the tab becomes visible again; that also keeps the login alive. */

require __DIR__ . '/_lib/core.php';
require __DIR__ . '/_lib/auth.php';

require_method('GET');
json_out(['member' => require_login()]);
