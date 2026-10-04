#!/usr/bin/env python3
"""Turns the old sample data (database/database.json, next to www/) into SQL INSERTs for a dev database.

Usage (from the www/ folder):
    python3 db/tools/seed_from_json.py ../database/database.json > /tmp/dev_seed.sql
Then import /tmp/dev_seed.sql in phpMyAdmin AFTER db/migrations/001_schema.sql.

- Keeps all ids, so links between tables stay correct.
- Song files: only the file name is stored (the app knows the folders). PDF and pitch-pipe rows become
  songs.sheet_file / songs.pitch_notes. Documents get "documents/" in front. URLs (http...) are kept as-is.
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
    if table == 'documents':
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


def to_new_song_files(data):
    """Old sample layout -> new: PDF and pitch tones become columns on songs; only sound files stay, file name only."""
    files = data.get('song_voice_files', [])
    by_song = {}
    for row in sorted(files, key=lambda r: (r['song_id'], r.get('sort_order', 0), r['id'])):
        by_song.setdefault(row['song_id'], []).append(row)
    for song in data.get('songs', []):
        rows = by_song.get(song['id'], [])
        sheet = next((r for r in rows if r.get('type') == 'sheet' and r.get('file')), None)
        song['sheet_file'] = sheet['file'].split('/')[-1] if sheet else None
        tones = [r['start_note'] for r in rows if r.get('type') == 'pitch' and r.get('start_note')]
        song['pitch_notes'] = ' '.join(tones) or None
        video = song.get('choreography_url')
        if video and not video.startswith(('http://', 'https://')):
            song['choreography_url'] = video.split('/')[-1]
    sounds = []
    for song_id, rows in by_song.items():
        for order, r in enumerate([r for r in rows if r.get('type', 'audio') == 'audio' and r.get('file')], start=1):
            sounds.append({'id': r['id'], 'created_at': r.get('created_at'), 'created_by': r.get('created_by'),
                           'song_id': song_id, 'name': r['name'], 'file': r['file'].split('/')[-1], 'sort_order': order})
    data['song_voice_files'] = sounds


def main(path):
    data = json.load(open(path, encoding='utf-8'))
    to_new_song_files(data)
    for member in data.get('members', []):   # role keys were renamed: master -> admin, notes -> noteadmin
        member['roles'] = [{'master': 'admin', 'notes': 'noteadmin'}.get(role, role) for role in member.get('roles', [])]
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
