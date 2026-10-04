#!/usr/bin/env python3
"""Turns the old sample data (database/database.json, next to www/) into SQL INSERTs for a dev database.

Usage (from the www/ folder):
    python3 db/tools/seed_from_json.py ../database/database.json > /tmp/dev_seed.sql
Then import /tmp/dev_seed.sql in phpMyAdmin AFTER db/migrations/001_schema.sql.

- Keeps all ids, so links between tables stay correct.
- Media paths become paths inside storage/ (the media rule in .info/Plan.md):
  song files get "songs/" in front, documents get "documents/" in front. URLs (http...) are kept as-is.
- Nobody gets a password. Members set one with "Glemt passord" on the login page.
"""
import json
import sys

TABLE_ORDER = [
    'members', 'boards', 'songs', 'song_voice_files', 'genres', 'song_genres', 'member_songs',
    'repertoires', 'repertoire_songs', 'practice_plans', 'practice_logs', 'practice_competitions',
    'attendance', 'achievements', 'member_achievements', 'documents', 'resolutions',
    'login_backgrounds', 'settings',
]
JSON_COLUMNS = {'roles', 'present_member_ids', 'value'}


def storage_path(folder, value):
    if not value or value.startswith(('http://', 'https://')):
        return value
    return f'{folder}/{value}'


def fix_paths(table, row):
    if table == 'song_voice_files':
        row['file'] = storage_path('songs', row.get('file'))
    elif table == 'songs':
        row['choreography_url'] = storage_path('songs', row.get('choreography_url'))
    elif table == 'documents':
        row['file'] = storage_path('documents', row.get('file'))
    return row


def sql_value(column, value):
    if value is None:
        return 'NULL'
    if column in JSON_COLUMNS:
        value = json.dumps(value, ensure_ascii=False)
    elif isinstance(value, bool):
        return '1' if value else '0'
    elif isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace('\\', '\\\\').replace("'", "''") + "'"


def main(path):
    data = json.load(open(path, encoding='utf-8'))
    print('SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS = 0;\n')
    for table in TABLE_ORDER:
        rows = [fix_paths(table, dict(row)) for row in data.get(table, [])]
        if not rows:
            continue
        columns = list(rows[0].keys())
        quoted = ', '.join(f'`{column}`' for column in columns)
        print(f'-- {table}: {len(rows)} rows')
        for start in range(0, len(rows), 200):
            values = ',\n  '.join(
                '(' + ', '.join(sql_value(column, row.get(column)) for column in columns) + ')'
                for row in rows[start:start + 200]
            )
            print(f'INSERT INTO `{table}` ({quoted}) VALUES\n  {values};')
        print()
    print('SET FOREIGN_KEY_CHECKS = 1;')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '../database/database.json')
