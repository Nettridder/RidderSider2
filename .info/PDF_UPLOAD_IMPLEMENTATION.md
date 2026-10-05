---
name: pdf-upload-implementation
description: Song PDF and audio file upload feature - completed 2026-10-05
metadata:
  type: project
  date: 2026-10-05
  status: completed
---

## What Changed

Files must now be actually uploaded to storage when adding/editing songs. Before: file name only, no upload.

## Files Modified

### 1. api/upload.php
- Added 'songpdf' and 'songaudio' to UPLOAD_FOLDERS (storage/songs/pdf/ and storage/songs/melody/)
- Added AUDIO_TYPES constant (audio/mpeg, audio/mp4, audio/wav, audio/ogg)
- Added MAX_SONG_FILE_BYTES (50 MB limit)
- Role requirement: noteadmin (same as other Note Admin actions)
- PDF validation: magic bytes check (must be application/pdf)
- Audio validation: MIME type check against AUDIO_TYPES
- Returns: {fileName: "name-3f9a1c.ext"} for both songpdf and songaudio
- No database update for song files (unlike profile/document uploads)

### 2. app/js/global.js (upload function)
- Updated docstring to document songpdf and songaudio kinds
- Added check: if songpdf or songaudio, return {fileName} directly (no DB save needed)

### 3. app/js/songs.js (pickSheet and pickSound functions)
- pickSheet(): now calls upload('songpdf', file), sets form.sheetFile to returned fileName
- pickSound(): now calls upload('songaudio', file), sets row.file to returned fileName
- Both await the upload and handle errors via $store.ui.fail()
- pickFileName() changed to return File object (not just name) for upload()

## How It Works

1. User picks PDF in "Noter (PDF)" field
2. pickSheet() uploads it via POST to api/upload.php?kind=songpdf
3. Upload API validates, generates safe filename, stores in storage/songs/pdf/
4. Returns {fileName: "bromance-3f9a1c.pdf"}
5. Form updates: FORM.sheetFile = "bromance-3f9a1c.pdf"
6. On save, this filename goes to songs.sheet_file

Same flow for audio files, different folder (storage/songs/melody/).

## Testing

1. Open Note Admin → Sanger
2. Add new song or edit existing
3. Click "Velg PDF" → pick a PDF file → uploads automatically
4. Verify file appears in storage/songs/pdf/
5. Click "Legg til lydfil" → pick audio → uploads automatically
6. Verify file appears in storage/songs/melody/
7. Save song → form submits, database updated with file names
8. Check song appears in public app with PDF and audio

## Role Protection

- Only noteadmin role can upload song files (same protection as other Note Admin forms)
- Enforced in api/upload.php via require_role()
