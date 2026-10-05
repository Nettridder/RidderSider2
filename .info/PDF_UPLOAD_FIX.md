---
name: pdf-upload-fix
description: Add real file upload for song PDFs and audio files
metadata:
  type: project
  date: 2026-10-05
---

## Context
Song PDF picker (`pickSheet()`) only copies file name to form—doesn't upload file. New PDFs cannot be added unless manually copied to `storage/songs/pdf/`. Same for audio files.

## Solution
Add real upload via `api/upload.php` with two new kinds: `songpdf` and `songaudio`.

### Critical Files to Modify

1. **www/api/upload.php**
   - Add 'songpdf' → 'songs/pdf' and 'songaudio' → 'songs/melody' to `UPLOAD_FOLDERS`
   - Add content checks for PDF (PDF magic bytes)
   - Add audio validation (MP3, M4A, WAV, OGG)
   - Enforce `noteadmin` role check
   - Max sizes: 50 MB

2. **www/app/js/songs.js** (lines 364, 370)
   - `pickSheet()`: call `$store.app.upload('songpdf', file)` on file pick
   - `pickSound()`: call `$store.app.upload('songaudio', file)` on file pick
   - Set form field to returned file name on success

### Reuse
- `$store.app.upload()` already exists in `app/js/global.js` (line ~245)
- `_lib/auth.php` has `require_role()` for noteadmin check
- Content validation patterns from existing document upload

### Verification
1. Add new song with PDF → uploads and saves file name
2. Add audio → uploads to melody folder
3. Edit song → can replace PDF/audio files
4. Non-noteadmin user → upload rejected
5. Verify files appear in `storage/songs/pdf/` and `storage/songs/melody/`
