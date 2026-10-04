<?php
/* WHO MAY WRITE WHAT — the only list api/save.php trusts.

   A table that is not in this list cannot be written through save.php at all.
   Columns that are not listed cannot be written (is_owner, password_hash, created_by, ... are never listed).

   For each table:
     'owner' => column that holds the member a row belongs to (used by the 'self' role).
     'rules' => role => what that role may do. The first rule that fits is used, so put the strongest role first.
       Roles:  'master' and 'notes' (members.roles; the owner and 'master' pass every role check),
               'self'   = any logged-in member, but only rows where owner column = their own id.
                          On insert the owner column is filled in by the server, the browser can't choose it.
       'ops'      => which of insert / update / delete are allowed.
       'columns'  => columns the browser may send.
       'only'     => optional limit on which rows: column => allowed values.
       'children' => rows saved together with the parent, e.g. a song with its genres and files.
                     child table => ['fk' => column pointing to the parent, 'columns' => [...]].
                     The children sent replace ALL existing children of that parent.

   Adding a feature that saves something new usually means adding one line here. */

declare(strict_types=1);

const ALL_OPS = ['insert', 'update', 'delete'];

/* Values allowed in members.roles. */
const ROLE_KEYS = ['master', 'notes'];

const BOARD_COLUMNS = [
  'year', 'term',
  'rittmester_id', 'rittmester_number', 'paragrafrytter_id', 'paragrafrytter_number',
  'finansridder_id', 'finansridder_number', 'noteridder_id', 'noteridder_number',
  'lagersjef_id', 'lagersjef_number', 'dirigent_id', 'dirigent_number',
];

const WRITE_RULES = [
  /* ---------- members ---------- */
  'members' => [
    'owner' => 'id',
    'rules' => [
      'master' => ['ops' => ALL_OPS, 'columns' => [
        'first_name', 'last_name', 'email', 'phone', 'voice_group', 'rank', 'status', 'roles',
        'joined_year', 'joined_term', 'left_year', 'left_term', 'email_level',
        'show_public', 'show_streak', 'show_songs', 'show_achievements',
      ]],
      // A member's own settings (Profil -> Innstillinger).
      'self' => ['ops' => ['update'], 'columns' => [
        'phone', 'email_level', 'show_public', 'show_streak', 'show_songs', 'show_achievements',
      ]],
    ],
  ],
  'boards' => ['rules' => ['master' => ['ops' => ALL_OPS, 'columns' => BOARD_COLUMNS]]],
  'attendance' => ['rules' => ['master' => ['ops' => ALL_OPS, 'columns' => ['rehearsal_date', 'present_member_ids']]]],
  'achievements' => ['rules' => ['master' => ['ops' => ['update'], 'columns' => ['title', 'description', 'image', 'is_secret']]]],
  'member_achievements' => ['rules' => ['master' => ['ops' => ['insert', 'delete'], 'columns' => ['member_id', 'achievement_id']]]],

  /* ---------- songs (Note-admin) ---------- */
  'songs' => ['rules' => ['notes' => [
    'ops' => ALL_OPS,
    'columns' => ['name', 'lyrics', 'choreography_url', 'is_secret'],
    'children' => [
      'song_genres' => ['fk' => 'song_id', 'columns' => ['genre_id']],
      'song_voice_files' => ['fk' => 'song_id', 'columns' => ['name', 'file', 'voice', 'type', 'start_note', 'sort_order']],
    ],
  ]]],
  'genres' => ['rules' => ['notes' => ['ops' => ALL_OPS, 'columns' => ['name', 'sort_order']]]],
  'repertoires' => ['rules' => ['notes' => [
    'ops' => ALL_OPS,
    'columns' => ['name', 'is_visible'],
    'children' => ['repertoire_songs' => ['fk' => 'repertoire_id', 'columns' => ['song_id', 'sort_order']]],
  ]]],
  // Song knowledge and favourites: every member sets their own.
  'member_songs' => ['owner' => 'member_id', 'rules' => ['self' => ['ops' => ALL_OPS, 'columns' => ['song_id', 'knowledge', 'is_favorite']]]],

  /* ---------- practice ---------- */
  'practice_plans' => ['rules' => ['notes' => ['ops' => ALL_OPS, 'columns' => ['date', 'title', 'description']]]],
  'practice_competitions' => ['rules' => ['notes' => ['ops' => ALL_OPS, 'columns' => ['name', 'start_date', 'end_date']]]],
  'practice_logs' => [
    'owner' => 'member_id',
    'rules' => [
      'notes' => ['ops' => ['delete'], 'columns' => []],                         // remove wrong registrations
      'self' => ['ops' => ['insert', 'delete'], 'columns' => ['date', 'minutes']],
    ],
  ],

  /* ---------- documents and look ---------- */
  'documents' => ['rules' => ['master' => ['ops' => ALL_OPS, 'columns' => ['title', 'file']]]],
  'resolutions' => ['rules' => ['master' => ['ops' => ALL_OPS, 'columns' => ['year', 'term', 'text', 'wiki_url']]]],
  'login_backgrounds' => ['rules' => ['master' => ['ops' => ALL_OPS, 'columns' => ['file', 'is_active']]]],
  'settings' => ['rules' => [
    'master' => ['ops' => ['insert', 'update'], 'columns' => ['key', 'value']],
    'notes' => ['ops' => ['insert', 'update'], 'columns' => ['key', 'value'], 'only' => ['key' => ['weekly_practice_goal_minutes']]],
  ]],
];
