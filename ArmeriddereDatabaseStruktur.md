


## Members
| Field | Type | Null | Key | Default | Extra | 
| - | - | - | - | - | - |
| id | int(11) | NO | PRI | NULL | auto_increment | 
| created_at | timestamp | NO | | current_timestamp() | |
| updated_at | timestamp | NO | | current_timestamp() | |
| created_by | Member.id | YES | | | |
| last_login | timestamp | YES | | NULL | |
| email | varchar(255) | NO | UNI | NULL | |
| password | tinyblob | NO | | NULL | |
| first_name | varchar(100) | NO | | NULL | |
| last_name | varchar(100) | NO | | NULL | |
| voice_group | "T1"/"T2"/"B1"/"B2" | NO | | NULL | |
| status | "active"/"ypp.com." | NO | | NULL | |
| want_email | tinyint(1) | YES | | 0 | |
| show_streak | tinyint(1) | YES | | 0 | |
| show_songar | tinyint(1) | YES | | 0 | |
| show_achievements | tinyint(1) | YES | | 0 | |
| image_file | varchar(255) | YES | | ukjend_ridder.png | |


# Authtokens (for creating new password)
| Field | Type | Null | Key | Default | Extra | 
| - | - | - | - | - | - |
| ID | int(11) | NO | PRI | NULL | auto_increment |
| Token | char(64) | YES | | NULL | |
| Medlem_ID | int(11) | NO | MUL | NULL | |
| Utløper | datetime | YES | | NULL | |


## Songs
* id: index, not null
* created_at: date, default = now
* updated_at: date, default = now
* created_by: Members.id, not null
* name: string, not null
* file: string (fileName)
* song_text: string
* video_file: string (fileName)
* is_secret: bool

## Achievements
| Field | Type | Null | Key | Default | Extra | 
| - | - | - | - | - | - |
| id | int(11) | NO | PRI | NULL | auto_increment | |
| illustrasjon | varchar(128) | NO | | standardillustrasjon.png | |
| tittel | varchar(128) | NO | | NULL | Skildring | varchar(256) | NO | NULL | |
| hemmeleg | varchar(3) | NO | | NULL | AchievementType | varchar(128) | NO | |
| diverse | AchievementRekkefølgje | tinyint(4) | YES | | NULL | |
