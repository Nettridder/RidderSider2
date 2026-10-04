<?php
/* POST -> ends the login in this browser only. */

require __DIR__ . '/_lib/core.php';
require __DIR__ . '/_lib/auth.php';

require_method('POST');
end_login();
json_out(['ok' => true]);
