-- 001_schema.sql — creates every table for the new RidderSider2 database.
--
-- Source of truth for meaning of each column: .info/DatabaseStrukture.md.
-- Run by hand in phpMyAdmin on an EMPTY database (dev first). Re-running on a database
-- that already has these tables fails on purpose — drop the tables first if you want a clean start.
--
-- Conventions (see .info/Plan.md):
--   * English snake_case, plural table names, link tables named owner-first.
--   * Every table: id, created_at, updated_at, created_by, updated_by.
--     created_by / updated_by -> members.id, ON DELETE SET NULL. NULL = done by the system.
--   * Semester = year smallint + term enum('spring','autumn').

SET NAMES utf8mb4;

-- SAFETY: stop at once if this is run in the old live site's database. Then phpMyAdmin shows the error
-- "Subquery returns more than 1 row" on the line below. Pick the dev database (left in phpMyAdmin) and run again.
SET @STOP_this_is_the_live_database_choose_the_dev_database = IF(DATABASE() = 'armeriddere', (SELECT 1 UNION SELECT 2), 1);
SET @STOP_old_site_tables_found_choose_the_dev_database = IF(EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('Songar', 'Sjangrar', 'mainwp_posts')), (SELECT 1 UNION SELECT 2), 1);

SET FOREIGN_KEY_CHECKS = 0;

-- ==================== Members ====================

CREATE TABLE members (
  id                int(11)      NOT NULL AUTO_INCREMENT,
  created_at        timestamp    NOT NULL DEFAULT current_timestamp(),
  updated_at        timestamp    NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  created_by        int(11)      NULL,
  updated_by        int(11)      NULL,
  last_login        timestamp    NULL DEFAULT NULL,
  email             varchar(255) NOT NULL,
  phone             varchar(20)  NULL,
  -- password_hash() output. NULL or a hash of a random string = nobody can log in
  -- until the member uses "Gløymt passord".
  password_hash     varchar(255) NULL,
  first_name        varchar(100) NOT NULL,
  last_name         varchar(100) NOT NULL,
  voice_group       enum('T1','T2','B1','B2') NOT NULL,
  status            enum('active','former') NOT NULL DEFAULT 'active',
  `rank`            enum('aspirant','knekt','ridder','ridder_1st_class','kommandorridder','storridder') NOT NULL DEFAULT 'aspirant',
  roles             longtext     NOT NULL DEFAULT '[]' CHECK (json_valid(roles)),
  -- Only changeable with SQL directly in the database. No API ever writes it.
  is_owner          tinyint(1)   NOT NULL DEFAULT 0,
  joined_year       smallint     NOT NULL,
  joined_term       enum('spring','autumn') NOT NULL,
  left_year         smallint     NULL,
  left_term         enum('spring','autumn') NULL,
  email_level       enum('all','important') NOT NULL DEFAULT 'all',
  -- Shown in the members section of the public front page (armeriddere.no/#team). Opt-out per member.
  show_public       tinyint(1)   NOT NULL DEFAULT 1,
  show_streak       tinyint(1)   NOT NULL DEFAULT 0,
  show_songs        tinyint(1)   NOT NULL DEFAULT 0,
  show_achievements tinyint(1)   NOT NULL DEFAULT 0,
  image_file        varchar(255) NOT NULL DEFAULT 'ukjend_ridder.png',
  PRIMARY KEY (id),
  UNIQUE KEY uq_members_email (email),
  KEY ix_members_created_by (created_by),
  KEY ix_members_updated_by (updated_by),
  CONSTRAINT fk_members_created_by FOREIGN KEY (created_by) REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT fk_members_updated_by FOREIGN KEY (updated_by) REFERENCES members (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Login cookies and password-reset links. Only the SHA-256 hash of the token is stored;
-- the real token exists only in the member's cookie or in the email link.
CREATE TABLE auth_tokens (
  id          int(11)    NOT NULL AUTO_INCREMENT,
  created_at  timestamp  NOT NULL DEFAULT current_timestamp(),
  updated_at  timestamp  NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  created_by  int(11)    NULL,
  updated_by  int(11)    NULL,
  member_id   int(11)    NOT NULL,
  purpose     enum('login','reset') NOT NULL,
  token_hash  char(64)   NOT NULL,
  -- login: 90 days, slid forward on use. reset: 1 hour. Expired rows are deleted by the API.
  expires_at  datetime   NOT NULL,
  user_agent  varchar(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_auth_tokens_hash (token_hash),
  KEY ix_auth_tokens_member (member_id, purpose),
  KEY ix_auth_tokens_expires (expires_at),
  CONSTRAINT fk_auth_tokens_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE,
  CONSTRAINT fk_auth_tokens_created_by FOREIGN KEY (created_by) REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT fk_auth_tokens_updated_by FOREIGN KEY (updated_by) REFERENCES members (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Failed logins, reset requests and contact-form posts, used only for rate limiting.
-- Rows older than a day are deleted by the API.
CREATE TABLE auth_attempts (
  id          int(11)      NOT NULL AUTO_INCREMENT,
  created_at  timestamp    NOT NULL DEFAULT current_timestamp(),
  kind        enum('login','reset','contact') NOT NULL,
  email       varchar(255) NOT NULL,
  ip          varchar(45)  NOT NULL,
  PRIMARY KEY (id),
  KEY ix_auth_attempts_email (kind, email, created_at),
  KEY ix_auth_attempts_ip (kind, ip, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== Board ====================

CREATE TABLE boards (
  id                     int(11)   NOT NULL AUTO_INCREMENT,
  created_at             timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at             timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  created_by             int(11)   NULL,
  updated_by             int(11)   NULL,
  year                   smallint  NOT NULL,
  term                   enum('spring','autumn') NOT NULL,
  rittmester_id          int(11)   NULL,
  rittmester_number      smallint  NULL,
  paragrafrytter_id      int(11)   NULL,
  paragrafrytter_number  smallint  NULL,
  finansridder_id        int(11)   NULL,
  finansridder_number    smallint  NULL,
  noteridder_id          int(11)   NULL,
  noteridder_number      smallint  NULL,
  lagersjef_id           int(11)   NULL,
  lagersjef_number       smallint  NULL,
  dirigent_id            int(11)   NULL,
  dirigent_number        smallint  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_boards_semester (year, term),
  CONSTRAINT fk_boards_created_by     FOREIGN KEY (created_by)        REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT fk_boards_updated_by     FOREIGN KEY (updated_by)        REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT fk_boards_rittmester     FOREIGN KEY (rittmester_id)     REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT fk_boards_paragrafrytter FOREIGN KEY (paragrafrytter_id) REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT fk_boards_finansridder   FOREIGN KEY (finansridder_id)   REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT fk_boards_noteridder     FOREIGN KEY (noteridder_id)     REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT fk_boards_lagersjef      FOREIGN KEY (lagersjef_id)      REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT fk_boards_dirigent       FOREIGN KEY (dirigent_id)       REFERENCES members (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== Songs ====================

CREATE TABLE songs (
  id               int(11)      NOT NULL AUTO_INCREMENT,
  created_at       timestamp    NOT NULL DEFAULT current_timestamp(),
  updated_at       timestamp    NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  created_by       int(11)      NULL,
  updated_by       int(11)      NULL,
  name             varchar(255) NOT NULL,
  lyrics           text         NULL,
  -- "http..." = external URL (YouTube), anything else = path inside storage/.
  choreography_url varchar(512) NULL,
  is_secret        tinyint(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_songs_name (name),
  CONSTRAINT fk_songs_created_by FOREIGN KEY (created_by) REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT fk_songs_updated_by FOREIGN KEY (updated_by) REFERENCES members (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE song_voice_files (
  id          int(11)      NOT NULL AUTO_INCREMENT,
  created_at  timestamp    NOT NULL DEFAULT current_timestamp(),
  updated_at  timestamp    NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  created_by  int(11)      NULL,
  updated_by  int(11)      NULL,
  song_id     int(11)      NOT NULL,
  name        varchar(128) NOT NULL,
  -- "http..." = external URL, anything else = path inside storage/ (e.g. songs/audio/28_bass.mp3).
  file        varchar(255) NULL,
  voice       enum('T1','T2','T3','B1','B2') NULL,
  type        enum('audio','sheet','pitch') NOT NULL DEFAULT 'audio',
  -- Pitch-pipe start note for type = 'pitch', e.g. "C4".
  start_note  varchar(8)   NULL,
  sort_order  tinyint      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_song_voice_files_song (song_id),
  CONSTRAINT fk_song_voice_files_song       FOREIGN KEY (song_id)    REFERENCES songs (id)   ON DELETE CASCADE,
  CONSTRAINT fk_song_voice_files_created_by FOREIGN KEY (created_by) REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT fk_song_voice_files_updated_by FOREIGN KEY (updated_by) REFERENCES members (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE genres (
  id          int(11)     NOT NULL AUTO_INCREMENT,
  created_at  timestamp   NOT NULL DEFAULT current_timestamp(),
  updated_at  timestamp   NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  created_by  int(11)     NULL,
  updated_by  int(11)     NULL,
  name        varchar(64) NOT NULL,
  sort_order  tinyint     NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_genres_name (name),
  CONSTRAINT fk_genres_created_by FOREIGN KEY (created_by) REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT fk_genres_updated_by FOREIGN KEY (updated_by) REFERENCES members (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE song_genres (
  id          int(11)   NOT NULL AUTO_INCREMENT,
  created_at  timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at  timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  created_by  int(11)   NULL,
  updated_by  int(11)   NULL,
  song_id     int(11)   NOT NULL,
  genre_id    int(11)   NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_song_genres (song_id, genre_id),
  KEY ix_song_genres_genre (genre_id),
  CONSTRAINT fk_song_genres_song       FOREIGN KEY (song_id)    REFERENCES songs (id)   ON DELETE CASCADE,
  CONSTRAINT fk_song_genres_genre      FOREIGN KEY (genre_id)   REFERENCES genres (id)  ON DELETE CASCADE,
  CONSTRAINT fk_song_genres_created_by FOREIGN KEY (created_by) REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT fk_song_genres_updated_by FOREIGN KEY (updated_by) REFERENCES members (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sparse: a row exists only when knowledge > 0 or is_favorite = 1.
CREATE TABLE member_songs (
  id           int(11)    NOT NULL AUTO_INCREMENT,
  created_at   timestamp  NOT NULL DEFAULT current_timestamp(),
  updated_at   timestamp  NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  created_by   int(11)    NULL,
  updated_by   int(11)    NULL,
  member_id    int(11)    NOT NULL,
  song_id      int(11)    NOT NULL,
  knowledge    tinyint    NOT NULL DEFAULT 0,
  is_favorite  tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_member_songs (member_id, song_id),
  KEY ix_member_songs_song (song_id, knowledge),
  CONSTRAINT fk_member_songs_member     FOREIGN KEY (member_id)  REFERENCES members (id) ON DELETE CASCADE,
  CONSTRAINT fk_member_songs_song       FOREIGN KEY (song_id)    REFERENCES songs (id)   ON DELETE CASCADE,
  CONSTRAINT fk_member_songs_created_by FOREIGN KEY (created_by) REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT fk_member_songs_updated_by FOREIGN KEY (updated_by) REFERENCES members (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== Repertoire ====================

CREATE TABLE repertoires (
  id          int(11)      NOT NULL AUTO_INCREMENT,
  created_at  timestamp    NOT NULL DEFAULT current_timestamp(),
  updated_at  timestamp    NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  created_by  int(11)      NULL,
  updated_by  int(11)      NULL,
  name        varchar(128) NOT NULL,
  is_visible  tinyint(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_repertoires_created_by FOREIGN KEY (created_by) REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT fk_repertoires_updated_by FOREIGN KEY (updated_by) REFERENCES members (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE repertoire_songs (
  id             int(11)   NOT NULL AUTO_INCREMENT,
  created_at     timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at     timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  created_by     int(11)   NULL,
  updated_by     int(11)   NULL,
  repertoire_id  int(11)   NOT NULL,
  song_id        int(11)   NOT NULL,
  sort_order     smallint  NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_repertoire_songs (repertoire_id, song_id),
  KEY ix_repertoire_songs_song (song_id),
  CONSTRAINT fk_repertoire_songs_repertoire FOREIGN KEY (repertoire_id) REFERENCES repertoires (id) ON DELETE CASCADE,
  CONSTRAINT fk_repertoire_songs_song       FOREIGN KEY (song_id)       REFERENCES songs (id)       ON DELETE CASCADE,
  CONSTRAINT fk_repertoire_songs_created_by FOREIGN KEY (created_by)    REFERENCES members (id)     ON DELETE SET NULL,
  CONSTRAINT fk_repertoire_songs_updated_by FOREIGN KEY (updated_by)    REFERENCES members (id)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== Practice ====================

CREATE TABLE practice_plans (
  id           int(11)      NOT NULL AUTO_INCREMENT,
  created_at   timestamp    NOT NULL DEFAULT current_timestamp(),
  updated_at   timestamp    NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  created_by   int(11)      NULL,
  updated_by   int(11)      NULL,
  date         date         NOT NULL,
  title        varchar(128) NOT NULL,
  description  text         NULL,
  PRIMARY KEY (id),
  KEY ix_practice_plans_date (date),
  CONSTRAINT fk_practice_plans_created_by FOREIGN KEY (created_by) REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT fk_practice_plans_updated_by FOREIGN KEY (updated_by) REFERENCES members (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE practice_logs (
  id          int(11)   NOT NULL AUTO_INCREMENT,
  created_at  timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at  timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  created_by  int(11)   NULL,
  updated_by  int(11)   NULL,
  member_id   int(11)   NOT NULL,
  date        date      NOT NULL,
  minutes     smallint  NOT NULL CHECK (minutes BETWEEN 1 AND 600),
  PRIMARY KEY (id),
  KEY ix_practice_logs_member_date (member_id, date),
  CONSTRAINT fk_practice_logs_member     FOREIGN KEY (member_id)  REFERENCES members (id) ON DELETE CASCADE,
  CONSTRAINT fk_practice_logs_created_by FOREIGN KEY (created_by) REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT fk_practice_logs_updated_by FOREIGN KEY (updated_by) REFERENCES members (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE practice_competitions (
  id          int(11)      NOT NULL AUTO_INCREMENT,
  created_at  timestamp    NOT NULL DEFAULT current_timestamp(),
  updated_at  timestamp    NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  created_by  int(11)      NULL,
  updated_by  int(11)      NULL,
  name        varchar(128) NOT NULL,
  start_date  date         NOT NULL,
  end_date    date         NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT ck_practice_competitions_dates CHECK (end_date >= start_date),
  CONSTRAINT fk_practice_competitions_created_by FOREIGN KEY (created_by) REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT fk_practice_competitions_updated_by FOREIGN KEY (updated_by) REFERENCES members (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== Attendance ====================

CREATE TABLE attendance (
  id                  int(11)   NOT NULL AUTO_INCREMENT,
  created_at          timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at          timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  created_by          int(11)   NULL,
  updated_by          int(11)   NULL,
  rehearsal_date      date      NOT NULL,
  present_member_ids  longtext  NOT NULL DEFAULT '[]' CHECK (json_valid(present_member_ids)),
  PRIMARY KEY (id),
  UNIQUE KEY uq_attendance_date (rehearsal_date),
  CONSTRAINT fk_attendance_created_by FOREIGN KEY (created_by) REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT fk_attendance_updated_by FOREIGN KEY (updated_by) REFERENCES members (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== Achievements ====================

CREATE TABLE achievements (
  id             int(11)      NOT NULL AUTO_INCREMENT,
  created_at     timestamp    NOT NULL DEFAULT current_timestamp(),
  updated_at     timestamp    NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  created_by     int(11)      NULL,
  updated_by     int(11)      NULL,
  `key`          varchar(64)  NOT NULL,
  title          varchar(128) NOT NULL,
  description    varchar(256) NOT NULL,
  image          varchar(128) NOT NULL DEFAULT 'standardillustrasjon.png',
  trigger_event  varchar(64)  NOT NULL,
  is_secret      tinyint(1)   NOT NULL DEFAULT 0,
  sort_order     tinyint      NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_achievements_key (`key`),
  CONSTRAINT fk_achievements_created_by FOREIGN KEY (created_by) REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT fk_achievements_updated_by FOREIGN KEY (updated_by) REFERENCES members (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE member_achievements (
  id              int(11)   NOT NULL AUTO_INCREMENT,
  created_at      timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at      timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  created_by      int(11)   NULL,
  updated_by      int(11)   NULL,
  member_id       int(11)   NOT NULL,
  achievement_id  int(11)   NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_member_achievements (member_id, achievement_id),
  KEY ix_member_achievements_achievement (achievement_id),
  CONSTRAINT fk_member_achievements_member      FOREIGN KEY (member_id)      REFERENCES members (id)      ON DELETE CASCADE,
  CONSTRAINT fk_member_achievements_achievement FOREIGN KEY (achievement_id) REFERENCES achievements (id) ON DELETE CASCADE,
  CONSTRAINT fk_member_achievements_created_by  FOREIGN KEY (created_by)     REFERENCES members (id)      ON DELETE SET NULL,
  CONSTRAINT fk_member_achievements_updated_by  FOREIGN KEY (updated_by)     REFERENCES members (id)      ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== Documents ====================

CREATE TABLE documents (
  id          int(11)      NOT NULL AUTO_INCREMENT,
  created_at  timestamp    NOT NULL DEFAULT current_timestamp(),
  updated_at  timestamp    NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  created_by  int(11)      NULL,
  updated_by  int(11)      NULL,
  title       varchar(255) NOT NULL,
  -- Path inside storage/, e.g. documents/2026-09-styremote.pdf
  file        varchar(255) NOT NULL,
  PRIMARY KEY (id),
  KEY ix_documents_created_at (created_at),
  KEY ix_documents_title (title),
  CONSTRAINT fk_documents_created_by FOREIGN KEY (created_by) REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT fk_documents_updated_by FOREIGN KEY (updated_by) REFERENCES members (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE resolutions (
  id          int(11)      NOT NULL AUTO_INCREMENT,
  created_at  timestamp    NOT NULL DEFAULT current_timestamp(),
  updated_at  timestamp    NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  created_by  int(11)      NULL,
  updated_by  int(11)      NULL,
  year        smallint     NOT NULL,
  term        enum('spring','autumn') NOT NULL,
  text        text         NOT NULL,
  wiki_url    varchar(512) NOT NULL,
  PRIMARY KEY (id),
  KEY ix_resolutions_semester (year, term),
  CONSTRAINT fk_resolutions_created_by FOREIGN KEY (created_by) REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT fk_resolutions_updated_by FOREIGN KEY (updated_by) REFERENCES members (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== Look and setup ====================

CREATE TABLE login_backgrounds (
  id          int(11)      NOT NULL AUTO_INCREMENT,
  created_at  timestamp    NOT NULL DEFAULT current_timestamp(),
  updated_at  timestamp    NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  created_by  int(11)      NULL,
  updated_by  int(11)      NULL,
  -- Path inside storage/images/backgrounds/
  file        varchar(255) NOT NULL,
  is_active   tinyint(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  CONSTRAINT fk_login_backgrounds_created_by FOREIGN KEY (created_by) REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT fk_login_backgrounds_updated_by FOREIGN KEY (updated_by) REFERENCES members (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE settings (
  id          int(11)     NOT NULL AUTO_INCREMENT,
  created_at  timestamp   NOT NULL DEFAULT current_timestamp(),
  updated_at  timestamp   NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  created_by  int(11)     NULL,
  updated_by  int(11)     NULL,
  `key`       varchar(64) NOT NULL,
  value       longtext    NULL CHECK (value IS NULL OR json_valid(value)),
  PRIMARY KEY (id),
  UNIQUE KEY uq_settings_key (`key`),
  CONSTRAINT fk_settings_created_by FOREIGN KEY (created_by) REFERENCES members (id) ON DELETE SET NULL,
  CONSTRAINT fk_settings_updated_by FOREIGN KEY (updated_by) REFERENCES members (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
