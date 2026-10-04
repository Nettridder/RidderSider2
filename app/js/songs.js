/* Songs: song list, knowledge colours, starting notes, the note player, and the Noter / Note-admin pages. */

/* ==================== Shared: pitch player ==================== */

function noteFrequency(note) {
  const match = /^([A-G])([♭b♯#]?)(\d)$/.exec(note);
  if (!match) return 220;
  const semitone = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[match[1]] + (match[2] === '♭' || match[2] === 'b' ? -1 : match[2] ? 1 : 0);
  const midiNumber = 12 * (Number(match[3]) + 1) + semitone;
  return 440 * Math.pow(2, (midiNumber - 69) / 12);
}

function pitchPlayer() {
  const NOTE_GAP_SECONDS = 0.8, NOTE_LENGTH_SECONDS = 1.1;
  return {
    playingSongId: null,
    playingNoteIndex: null,
    scheduledOscillators: [],
    scheduledTimers: [],
    noteParts(note) { return { letter: note[0], accidental: note.slice(1, -1), octave: note.slice(-1) } },
    stopNotes() {
      this.scheduledOscillators.forEach(oscillator => { try { oscillator.stop(); } catch (error) { /* already stopped */ } });
      this.scheduledTimers.forEach(clearTimeout);
      this.scheduledOscillators = []; this.scheduledTimers = [];
      this.playingSongId = null; this.playingNoteIndex = null;
    },
    playSequence(songId, notes, indexes) {
      this.stopNotes();
      try {
        this.audioContext = this.audioContext || new (window.AudioContext || window.webkitAudioContext)();
        if (this.audioContext.state === 'suspended') this.audioContext.resume();
        const startTime = this.audioContext.currentTime + 0.03;
        indexes.forEach((noteIndex, position) => {
          const time = startTime + position * NOTE_GAP_SECONDS;
          const oscillator = this.audioContext.createOscillator(), volume = this.audioContext.createGain();
          oscillator.type = 'triangle';
          oscillator.frequency.value = noteFrequency(notes[noteIndex].start_note);
          volume.gain.setValueAtTime(0, time);
          volume.gain.linearRampToValueAtTime(0.25, time + 0.04);
          volume.gain.exponentialRampToValueAtTime(0.001, time + NOTE_LENGTH_SECONDS);
          oscillator.connect(volume).connect(this.audioContext.destination);
          oscillator.start(time); oscillator.stop(time + NOTE_LENGTH_SECONDS + 0.05);
          this.scheduledOscillators.push(oscillator);
        });
      } catch (error) { /* no audio available: still show the playing state */ }
      this.playingSongId = songId; this.playingNoteIndex = indexes[0];
      indexes.forEach((noteIndex, position) => {
        if (position) this.scheduledTimers.push(setTimeout(() => { this.playingNoteIndex = noteIndex; }, position * NOTE_GAP_SECONDS * 1000));
      });
      this.scheduledTimers.push(setTimeout(() => { this.playingSongId = null; this.playingNoteIndex = null; }, ((indexes.length - 1) * NOTE_GAP_SECONDS + NOTE_LENGTH_SECONDS) * 1000));
    },
    playNotes(songId, notes) { this.playSequence(songId, notes, notes.map((note, index) => index)); },
    playNote(songId, notes, index) { this.playSequence(songId, notes, [index]); },
    isPlayingNote(songId, index) { return this.playingSongId === songId && this.playingNoteIndex === index },
  };
}

/* ==================== Shared: song list (used by Sanger and Repertoar; the page provides `songs` and `emptySongListText`) ==================== */

registerPiece('song-list', `
<ul class="list song-list">
  <template x-for="song in songs" :key="song.id">
    <li class="list__row song-list__row">
      <span class="knowledge-dot" :class="'knowledge-dot--' + knowledgeLevel($store.app.knowledgeOf(song.id)).key"
            :title="knowledgeLevel($store.app.knowledgeOf(song.id)).label" role="img" :aria-label="knowledgeLevel($store.app.knowledgeOf(song.id)).label"></span>
      <a class="song-list__link" :href="pageHref('noter/sang') + '?id=' + song.id">
        <span class="list__title">
          <span x-text="song.name"></span>
          <svg class="song-list__favorite" x-show="$store.app.isFavorite(song.id)" aria-label="Favoritt"><use href="#icon-heart"/></svg>
        </span>
        <span class="list__meta">
          <span x-text="$store.app.songGenreNames(song.id)"></span>
          <span class="song-list__media">
            <svg x-show="$store.app.songSheetFile(song.id)" aria-label="Noter"><use href="#icon-sheet"/></svg>
            <svg x-show="$store.app.songAudioFiles(song.id).length" aria-label="Lydfiler"><use href="#icon-audio"/></svg>
            <svg x-show="song.choreography_url" aria-label="Video"><use href="#icon-video"/></svg>
          </span>
        </span>
      </a>
      <span class="badge badge--muted" x-show="song.is_secret">Hemmelig</span>
    </li>
  </template>
</ul>
<p class="empty-state" x-show="!songs.length" x-text="emptySongListText"></p>`);

/* ==================== Sanger (noter/sanger) ==================== */

function songLibraryPage() {
  return {
    search: '',
    knowledgeFilter: null,
    genreFilter: 0,
    get app() { return this.$store.app },
    countWithKnowledge(level) { return this.app.visibleSongs.filter(song => this.app.knowledgeOf(song.id) === level).length },
    emptySongListText: 'Ingen sanger passer. Prøv et kortere søk eller en annen farge.',
    get songs() {
      const query = this.search.trim().toLowerCase();
      return this.app.visibleSongs.filter(song =>
        (!query || (song.name + ' ' + this.app.songGenreNames(song.id)).toLowerCase().includes(query)) &&
        (this.knowledgeFilter === null || this.app.knowledgeOf(song.id) === this.knowledgeFilter) &&
        (!this.genreFilter || this.app.songGenreIds(song.id).includes(this.genreFilter)));
    },
    knowledgeLevel,
  };
}

/* ==================== Repertoar (noter/repertoar) ==================== */

function repertoirePage() {
  return {
    get app() { return this.$store.app },
    get selectedId() { return Number(new URLSearchParams(location.search).get('id')) },
    get repertoire() {
      const repertoires = this.app.visibleRepertoires;
      return repertoires.find(repertoire => repertoire.id === this.selectedId) || repertoires[0] || null;
    },
    emptySongListText: 'Repertoaret er tomt ennå.',
    get songs() { return this.repertoire ? this.app.repertoireSongIds(this.repertoire.id).map(id => this.app.song(id)).filter(Boolean) : [] },
    init() {
      this.$watch('repertoire', () => this.showRepertoireMenu());
      this.showRepertoireMenu();
    },
    showRepertoireMenu() {
      const repertoires = this.app.visibleRepertoires;
      this.$store.ui.nestedMenu = repertoires.length > 1 ? repertoires.map(repertoire => ({
        label: repertoire.name,
        href: 'repertoar.html?id=' + repertoire.id,
        isActive: this.repertoire && repertoire.id === this.repertoire.id,
        badge: repertoire.is_visible ? '' : 'Utkast',
      })) : [];
      if (this.repertoire) document.title = `${this.repertoire.name} – Mannskoret Arme Riddere`;
    },
  };
}

/* ==================== Sang (noter/sang) ==================== */

function songPage() {
  const SYNC_TOLERANCE_SECONDS = 0.12;
  const audioByTrackId = new Map();
  const gainByTrackId = new Map();
  let audioContext = null;
  let startToneIndex = 0;
  let startToneAutoPlay = false;

  return {
    ...pitchPlayer(),
    songId: Number(new URLSearchParams(location.search).get('id')),
    tracks: [],
    mode: 'mix',
    selectedVoiceTrack: null,
    showVoiceMenu: false,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    speed: 1,
    activeTab: 'sheet',
    playerOpen: localStorage.getItem('playerOpen') === 'true',

    get app() { return this.$store.app },
    get song() { const song = this.app.song(this.songId); return this.app.canSeeSong(song) ? song : null },
    get startNotes() { return this.app.songStartNotes(this.songId) },
    get mixTrack() { return this.tracks.find(track => !track.voice) },
    get voiceTracks() { return this.tracks.filter(track => track.voice) },
    get myVoiceTrack() { return this.voiceTracks.find(track => track.voice === this.app.me.voice_group) },
    get playingTracks() {
      if (this.mode === 'mix') return [this.mixTrack].filter(Boolean);
      return this.selectedVoiceTrack ? [this.selectedVoiceTrack] : this.voiceTracks;
    },
    get leadAudio() { return this.playingTracks.length ? audioByTrackId.get(this.playingTracks[0].id) : null },
    get sheetUrl() { const sheet = this.song && this.app.songSheetFile(this.song.id); return sheet ? storageUrl('songs/' + sheet.file) : '' },
    get youtubeId() { const match = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/.exec((this.song && this.song.choreography_url) || ''); return match ? match[1] : '' },
    get videoFileUrl() { const url = this.song && this.song.choreography_url; return url && !/^https?:/.test(url) ? storageUrl('songs/' + url) : '' },
    get tabs() {
      return [
        { key: 'sheet', label: 'Noter' },
        { key: 'video', label: 'Video' },
        { key: 'lyrics', label: 'Tekst' },
      ];
    },
    voiceAbbr(voice) {
      const map = { tenor1: 'T1', tenor2: 'T2', baritone: 'BAR', bass1: 'B1', bass2: 'B2' };
      return map[voice] || voice;
    },

    init() {
      if (!this.song) return;
      document.title = `${this.song.name} – Mannskoret Arme Riddere`;
      this.tracks = this.app.songAudioFiles(this.song.id).map(file => ({
        id: file.id, name: file.voice ? LABELS.voices[file.voice] : file.name, voice: file.voice, url: storageUrl('songs/' + file.file),
      }));
      this.mode = this.mixTrack ? 'mix' : 'voices';
      if (this.mode === 'voices' && this.myVoiceTrack) this.selectedVoiceTrack = this.myVoiceTrack;
      if (!this.sheetUrl && this.song.choreography_url) this.activeTab = 'video';
      else if (!this.sheetUrl && this.song.lyrics) this.activeTab = 'lyrics';
      this.tracks.forEach(track => {
        const audio = new Audio();
        audio.preload = 'metadata';
        audio.src = track.url;
        audio.addEventListener('loadedmetadata', () => { if (audio === this.leadAudio || !this.duration) this.duration = audio.duration; });
        audio.addEventListener('timeupdate', () => { if (audio === this.leadAudio) this.onLeadTimeUpdate(audio); });
        audio.addEventListener('ended', () => { if (audio === this.leadAudio) this.onEnded(); });
        audioByTrackId.set(track.id, audio);
      });
      window.addEventListener('pagehide', () => this.pause());
      if (this.sheetUrl) this.renderPdf(this.sheetUrl);
    },

    async renderPdf(url) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const pdf = await pdfjsLib.getDocument(url).promise;
      const container = document.getElementById('sheet-pages');
      if (!container) return;
      container.innerHTML = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const viewport = page.getViewport({ scale: 2 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context, viewport }).promise;
        canvas.className = 'sheet-page';
        container.appendChild(canvas);
      }
    },

    connectAudioGraph() {
      if (audioContext) return;
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioByTrackId.forEach((audio, trackId) => {
          const gain = audioContext.createGain();
          audioContext.createMediaElementSource(audio).connect(gain).connect(audioContext.destination);
          gainByTrackId.set(trackId, gain);
        });
      } catch (error) { audioContext = null; }
    },
    applySpeed() { audioByTrackId.forEach(audio => { audio.playbackRate = this.speed; }); },

    async play() {
      this.connectAudioGraph();
      if (audioContext && audioContext.state === 'suspended') await audioContext.resume();
      this.applySpeed();
      const audios = this.playingTracks.map(track => audioByTrackId.get(track.id));
      audios.forEach(audio => { audio.currentTime = Math.min(this.currentTime, audio.duration || this.currentTime); });
      this.isPlaying = true;
      try { await Promise.all(audios.map(audio => audio.play())); }
      catch (error) { this.isPlaying = false; this.$store.ui.notify('Kunne ikke spille av lyden.', 'Sjekk at lyden er på, og prøv igjen.'); }
    },
    pause() {
      audioByTrackId.forEach(audio => audio.pause());
      this.isPlaying = false;
    },
    togglePlay() { this.isPlaying ? this.pause() : this.play() },
    seekTo(seconds) {
      this.currentTime = Math.max(0, Math.min(seconds, this.duration || seconds));
      this.playingTracks.forEach(track => { audioByTrackId.get(track.id).currentTime = this.currentTime; });
    },
    seekBy(seconds) { this.seekTo(this.currentTime + seconds) },
    setMode(mode) {
      if (this.mode === mode) return;
      const wasPlaying = this.isPlaying;
      this.pause();
      this.mode = mode;
      if (this.mode === 'voices' && !this.selectedVoiceTrack && this.myVoiceTrack) this.selectedVoiceTrack = this.myVoiceTrack;
      if (this.leadAudio && this.leadAudio.duration) this.duration = this.leadAudio.duration;
      if (wasPlaying) this.play();
    },
    toggleVoiceMenu() { this.showVoiceMenu = !this.showVoiceMenu; },
    selectVoice(track) { this.selectedVoiceTrack = track; this.mode = 'voices'; },
    playStartTones() {
      startToneIndex = 0;
      startToneAutoPlay = true;
      this.playNextStartTone();
    },
    playNextStartTone() {
      if (!startToneAutoPlay || startToneIndex >= this.startNotes.length) {
        startToneAutoPlay = false;
        return;
      }
      this.playNote(this.song.id, this.startNotes, startToneIndex);
      startToneIndex++;
      setTimeout(() => this.playNextStartTone(), 1500);
    },
    onLeadTimeUpdate(lead) {
      this.currentTime = lead.currentTime;
      if (!this.isPlaying) return;
      this.playingTracks.forEach(track => {
        const audio = audioByTrackId.get(track.id);
        if (audio !== lead && !audio.ended && Math.abs(audio.currentTime - lead.currentTime) > SYNC_TOLERANCE_SECONDS) audio.currentTime = lead.currentTime;
      });
    },
    onEnded() {
      this.pause();
      this.currentTime = 0;
    },
    togglePlayer() { this.playerOpen = !this.playerOpen; localStorage.setItem('playerOpen', this.playerOpen); },
  };
}

/* ==================== Øvingsplan (noter/ovingsplan) ==================== */

function practicePlanPage() {
  return {
    get app() { return this.$store.app },
    startTime(plan) {
      const eventsThatDay = this.app.calendarEvents.filter(event => event.dateKey === plan.date && event.time && event.summary !== 'Styremøte');
      const rehearsal = eventsThatDay.find(event => event.summary === 'Øving') || eventsThatDay[0];
      return rehearsal ? rehearsal.time : '';
    },
    get upcomingPlans() {
      const today = format.dateKey(this.app.today);
      return this.app.db.practice_plans.filter(plan => plan.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    },
  };
}

/* ==================== Toneangiver (noter/toneangiver) ==================== */

function pitchPipePage() {
  return {
    ...pitchPlayer(),
    search: '',
    get app() { return this.$store.app },
    get songs() {
      const query = this.search.trim().toLowerCase();
      return this.app.visibleSongs.filter(song => this.app.songStartNotes(song.id).length && (!query || song.name.toLowerCase().includes(query)));
    },
  };
}

/* ==================== Note-admin: Sanger (noter/admin/sanger) ==================== */

const emptySongForm = () => ({ id: null, name: '', genreIds: [], isSecret: false, lyrics: '', choreographyUrl: '', files: [], showErrors: false });

function adminSongsPage() {
  return withAdminTools({
    newSong: emptySongForm(),
    editedSong: emptySongForm(),
    newGenreName: '',
    genreError: '',
    renamingGenreId: null,
    renamingGenreName: '',
    renameError: '',
    get sortedGenres() { return [...this.db.genres].sort((a, b) => a.sort_order - b.sort_order) },
    get filteredSongs() {
      return [...this.db.songs].sort((a, b) => a.name.localeCompare(b.name, 'nb'))
        .filter(song => this.matchesSearch(song.name, this.app.songGenreNames(song.id)));
    },
    fileSummary(songId) {
      const files = this.app.songFiles(songId);
      const count = type => files.filter(file => file.type === type).length;
      const parts = [['Lyd', count('audio')], ['Noter', count('sheet')], ['Toner', count('pitch')]].filter(([, number]) => number);
      return parts.length ? parts.map(([label, number]) => `${label} ${number}`).join(' · ') : 'Ingen filer';
    },
    songCountForGenre(genreId) { return this.db.song_genres.filter(link => link.genre_id === genreId).length },
    emptySongForm,
    addFileRow(form) { form.files.push({ rowKey: ++this.rowKey, id: null, name: '', voice: '', type: 'audio', startNote: '', file: '' }) },
    songFormFromRow(song) {
      return {
        id: song.id, name: song.name, genreIds: this.app.songGenreIds(song.id), isSecret: song.is_secret,
        lyrics: song.lyrics || '', choreographyUrl: song.choreography_url || '', showErrors: false,
        files: this.app.songFiles(song.id).map(file => ({ rowKey: ++this.rowKey, id: file.id, name: file.name, voice: file.voice || '', type: file.type, startNote: file.start_note || '', file: file.file || '' })),
      };
    },
    isValidSong(form) { form.showErrors = true; if (!form.name.trim()) { this.focusFirstInvalidField(); return false; } return true; },
    writeSongDetails(songId, form) {
      this.db.song_genres = this.db.song_genres.filter(link => link.song_id !== songId);
      form.genreIds.forEach(genreId => this.db.song_genres.push({ id: nextId(this.db.song_genres), created_at: timestampNow(), created_by: this.app.currentMemberId, song_id: songId, genre_id: genreId }));
      this.db.song_voice_files = this.db.song_voice_files.filter(file => file.song_id !== songId);
      form.files.forEach((row, index) => this.db.song_voice_files.push({
        id: nextId(this.db.song_voice_files), created_at: timestampNow(), created_by: this.app.currentMemberId, song_id: songId,
        name: row.name.trim() || (row.voice ? LABELS.voices[row.voice] : LABELS.fileTypes[row.type]),
        file: row.file || null, voice: row.voice || null, type: row.type,
        start_note: row.type === 'pitch' ? (row.startNote.trim() || null) : null, sort_order: index + 1,
      }));
    },
    addSong() {
      const form = this.newSong;
      if (!this.isValidSong(form)) return;
      const songId = nextId(this.db.songs);
      this.db.songs.push({ id: songId, created_at: timestampNow(), created_by: this.app.currentMemberId, name: form.name.trim(), lyrics: form.lyrics || null, choreography_url: form.choreographyUrl.trim() || null, is_secret: form.isSecret });
      this.writeSongDetails(songId, form);
      this.notify(`«${form.name.trim()}» er lagt til` + (form.isSecret ? ' som hemmelig.' : '.'));
      this.newSong = this.emptySongForm();
    },
    editSong(song, event) {
      this.editedSong = this.songFormFromRow(song);
      this.openDrawer('Rediger sang', song.name, event);
    },
    saveSong() {
      const form = this.editedSong;
      if (!this.isValidSong(form)) return;
      const song = this.app.song(form.id);
      Object.assign(song, { name: form.name.trim(), lyrics: form.lyrics || null, choreography_url: form.choreographyUrl.trim() || null, is_secret: form.isSecret });
      this.writeSongDetails(song.id, form);
      this.closeDrawer();
      this.notify(`Endringene i «${song.name}» er lagret.`);
    },
    deleteSong() {
      const songId = this.editedSong.id, name = this.app.song(songId).name;
      ['song_genres', 'song_voice_files', 'repertoire_songs', 'member_songs'].forEach(table => { this.db[table] = this.db[table].filter(row => row.song_id !== songId); });
      this.db.songs = this.db.songs.filter(song => song.id !== songId);
      this.closeDrawer(false);
      this.notify(`«${name}» er slettet.`);
    },
    genreNameProblem(name, exceptId) {
      if (!name.trim()) return 'Skriv inn et navn på sjangeren.';
      if (this.db.genres.some(genre => genre.id !== exceptId && genre.name.toLowerCase() === name.trim().toLowerCase())) return 'Den sjangeren finnes allerede.';
      return '';
    },
    addGenre() {
      this.genreError = this.genreNameProblem(this.newGenreName);
      if (this.genreError) { this.focusFirstInvalidField(); return; }
      const name = this.newGenreName.trim();
      this.db.genres.push({ id: nextId(this.db.genres), created_at: timestampNow(), created_by: this.app.currentMemberId, name, sort_order: Math.max(0, ...this.db.genres.map(genre => genre.sort_order)) + 1 });
      this.newGenreName = '';
      this.notify(`Sjangeren «${name}» er lagt til.`);
    },
    startRenamingGenre(genre) { this.renamingGenreId = genre.id; this.renamingGenreName = genre.name; this.renameError = ''; this.confirmingDeleteId = null; },
    saveGenreName(genre) {
      this.renameError = this.genreNameProblem(this.renamingGenreName, genre.id);
      if (this.renameError) return;
      genre.name = this.renamingGenreName.trim();
      this.renamingGenreId = null;
      this.notify(`Sjangeren heter nå «${genre.name}».`);
    },
    deleteGenre(genre) {
      this.db.song_genres = this.db.song_genres.filter(link => link.genre_id !== genre.id);
      this.db.genres = this.db.genres.filter(row => row.id !== genre.id);
      this.confirmingDeleteId = null;
      this.notify(`Sjangeren «${genre.name}» er slettet.`);
    },
  });
}

/* ==================== Note-admin: Repertoar (noter/admin/repertoar) ==================== */

function adminRepertoiresPage() {
  return withAdminTools({
    newRepertoire: { name: '', isVisible: false, showErrors: false },
    editedRepertoire: { id: null, name: '', isVisible: false, songIds: [], showErrors: false },
    songToAdd: '',
    get songsNotInRepertoire() {
      return [...this.db.songs].filter(song => !this.editedRepertoire.songIds.includes(song.id)).sort((a, b) => a.name.localeCompare(b.name, 'nb'));
    },
    songName(songId) { return (this.app.song(songId) || {}).name },
    songCountText(repertoireId) { const count = this.app.repertoireSongIds(repertoireId).length; return count + (count === 1 ? ' sang' : ' sanger'); },
    addRepertoire() {
      const form = this.newRepertoire;
      form.showErrors = true;
      if (!form.name.trim()) { this.focusFirstInvalidField(); return; }
      this.db.repertoires.push({ id: nextId(this.db.repertoires), created_at: timestampNow(), created_by: this.app.currentMemberId, name: form.name.trim(), is_visible: form.isVisible });
      this.notify(`«${form.name.trim()}» er opprettet. Trykk Rediger for å legge til sanger.`);
      this.newRepertoire = { name: '', isVisible: false, showErrors: false };
    },
    editRepertoire(repertoire, event) {
      this.editedRepertoire = { id: repertoire.id, name: repertoire.name, isVisible: repertoire.is_visible, songIds: this.app.repertoireSongIds(repertoire.id), showErrors: false };
      this.songToAdd = '';
      this.openDrawer('Rediger repertoar', repertoire.name, event);
    },
    moveSong(index, step) {
      const songIds = this.editedRepertoire.songIds, target = index + step;
      if (target < 0 || target >= songIds.length) return;
      const [songId] = songIds.splice(index, 1);
      songIds.splice(target, 0, songId);
    },
    addSongToRepertoire() {
      if (!this.songToAdd) return;
      this.editedRepertoire.songIds.push(Number(this.songToAdd));
      this.songToAdd = '';
    },
    saveRepertoire() {
      const form = this.editedRepertoire;
      form.showErrors = true;
      if (!form.name.trim()) { this.focusFirstInvalidField(); return; }
      const repertoire = this.db.repertoires.find(row => row.id === form.id);
      Object.assign(repertoire, { name: form.name.trim(), is_visible: form.isVisible });
      this.db.repertoire_songs = this.db.repertoire_songs.filter(link => link.repertoire_id !== form.id);
      form.songIds.forEach((songId, index) => this.db.repertoire_songs.push({ id: nextId(this.db.repertoire_songs), created_at: timestampNow(), created_by: this.app.currentMemberId, repertoire_id: form.id, song_id: songId, sort_order: index + 1 }));
      this.closeDrawer();
      this.notify(`«${repertoire.name}» er lagret.`);
    },
    deleteRepertoire(repertoire) {
      this.db.repertoire_songs = this.db.repertoire_songs.filter(link => link.repertoire_id !== repertoire.id);
      this.db.repertoires = this.db.repertoires.filter(row => row.id !== repertoire.id);
      this.confirmingDeleteId = null;
      this.notify(`«${repertoire.name}» er slettet.`);
    },
  });
}

/* ==================== Note-admin: Sangkunnskap (noter/admin/sangkunnskap) ==================== */

function songKnowledgePage() {
  return {
    search: '',
    selectedSongId: null,
    get app() { return this.$store.app },
    init() {
      const firstRepertoire = this.app.db.repertoires.find(repertoire => repertoire.is_visible);
      const firstSongId = firstRepertoire && this.app.repertoireSongIds(firstRepertoire.id)[0];
      this.selectedSongId = firstSongId || (this.sortedSongs[0] || {}).id;
      this.$watch('search', () => {
        if (!this.matchingSongs.some(song => song.id === this.selectedSongId) && this.matchingSongs.length) this.selectedSongId = this.matchingSongs[0].id;
      });
    },
    get sortedSongs() { return [...this.app.db.songs].sort((a, b) => a.name.localeCompare(b.name, 'nb')) },
    get matchingSongs() {
      const query = this.search.trim().toLowerCase();
      return this.sortedSongs.filter(song => !query || song.name.toLowerCase().includes(query));
    },
    get selectedSong() { return this.matchingSongs.find(song => song.id === this.selectedSongId) },
    membersInVoice(voice) {
      return this.app.activeMembers.filter(member => member.voice_group === voice)
        .sort((a, b) => this.app.knowledgeOf(this.selectedSongId, b.id) - this.app.knowledgeOf(this.selectedSongId, a.id) || this.app.memberName(a).localeCompare(this.app.memberName(b), 'nb'));
    },
    countFor(knowledge) { return this.app.activeMembers.filter(member => this.app.knowledgeOf(this.selectedSongId, member.id) === knowledge).length },
  };
}

/* ==================== Note-admin: Øvingsplan (noter/admin/ovingsplan) ==================== */

const emptyPlanForm = () => ({ id: null, date: '', title: '', description: '', showErrors: false });

function adminPracticePlanPage() {
  return withAdminTools({
    showing: 'upcoming',
    newPlan: emptyPlanForm(),
    editedPlan: emptyPlanForm(),
    get todayKey() { return format.dateKey(this.app.today) },
    get upcomingPlans() { return this.db.practice_plans.filter(plan => plan.date >= this.todayKey).sort((a, b) => a.date.localeCompare(b.date)) },
    get pastPlans() { return this.db.practice_plans.filter(plan => plan.date < this.todayKey).sort((a, b) => b.date.localeCompare(a.date)) },
    get shownPlans() { return this.showing === 'upcoming' ? this.upcomingPlans : this.pastPlans },
    isValidPlan(form) {
      form.showErrors = true;
      if (!form.date || !form.title.trim()) { this.focusFirstInvalidField(); return false; }
      return true;
    },
    addPlan() {
      const form = this.newPlan;
      if (!this.isValidPlan(form)) return;
      this.db.practice_plans.push({ id: nextId(this.db.practice_plans), created_at: timestampNow(), created_by: this.app.currentMemberId, date: form.date, title: form.title.trim(), description: form.description.trim() || null });
      this.showing = form.date >= this.todayKey ? 'upcoming' : 'past';
      this.notify(`«${form.title.trim()}» er lagt til i øvingsplanen.`);
      this.newPlan = emptyPlanForm();
    },
    editPlan(plan, event) {
      this.editedPlan = { id: plan.id, date: plan.date, title: plan.title, description: plan.description || '', showErrors: false };
      this.openDrawer('Rediger øving', format.longDate(format.parseDate(plan.date)), event);
    },
    savePlan() {
      const form = this.editedPlan;
      if (!this.isValidPlan(form)) return;
      const plan = this.db.practice_plans.find(row => row.id === form.id);
      Object.assign(plan, { date: form.date, title: form.title.trim(), description: form.description.trim() || null });
      this.closeDrawer();
      this.notify(`«${plan.title}» er lagret.`);
    },
    deletePlan(plan) {
      this.db.practice_plans = this.db.practice_plans.filter(row => row.id !== plan.id);
      this.confirmingDeleteId = null;
      this.notify(`«${plan.title}» er slettet fra øvingsplanen.`);
    },
  });
}

/* ==================== Note-admin: Øvingskonkurranse (noter/admin/ovingskonkurranse) ==================== */

const emptyCompetitionForm = () => ({ id: null, name: '', startDate: '', endDate: '', showErrors: false });

function adminCompetitionsPage() {
  return withAdminTools({
    newCompetition: emptyCompetitionForm(),
    editedCompetition: emptyCompetitionForm(),
    selectedCompetitionId: null,
    weeklyGoalMinutes: 60,
    weeklyGoalError: '',
    init() {
      const running = this.sortedCompetitions.find(competition => this.statusOf(competition) === 'running');
      this.selectedCompetitionId = (running || this.sortedCompetitions[0] || {}).id;
      this.weeklyGoalMinutes = this.app.weeklyGoal;
    },
    get todayKey() { return format.dateKey(this.app.today) },
    get sortedCompetitions() { return [...this.db.practice_competitions].sort((a, b) => b.start_date.localeCompare(a.start_date)) },
    get selectedCompetition() { return this.db.practice_competitions.find(competition => competition.id === this.selectedCompetitionId) },
    get standings() {
      const competition = this.selectedCompetition;
      if (!competition) return [];
      return this.app.activeMembers.map(member => ({
        member,
        minutes: this.app.practiceLogs(member.id).filter(log => log.date >= competition.start_date && log.date <= competition.end_date).reduce((sum, log) => sum + log.minutes, 0),
      })).sort((a, b) => b.minutes - a.minutes || this.app.memberName(a.member).localeCompare(this.app.memberName(b.member), 'nb'));
    },
    get topMinutes() { return this.standings.length ? this.standings[0].minutes : 0 },
    get recentLogs() { return [...this.db.practice_logs].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 15) },
    statusOf(competition) {
      if (competition.start_date > this.todayKey) return 'upcoming';
      if (competition.end_date < this.todayKey) return 'finished';
      return 'running';
    },
    statusLabel(competition) { return { running: 'Pågår', finished: 'Ferdig', upcoming: 'Kommer' }[this.statusOf(competition)] },
    statusBadgeClass(competition) { return { running: '', finished: 'badge--muted', upcoming: 'badge--success' }[this.statusOf(competition)] },
    periodText(competition) {
      return `${format.fullDate(format.parseDate(competition.start_date))} – ${format.fullDate(format.parseDate(competition.end_date))}`;
    },
    isValidCompetition(form) {
      form.showErrors = true;
      if (!form.name.trim() || !form.startDate || !form.endDate || form.endDate < form.startDate) { this.focusFirstInvalidField(); return false; }
      return true;
    },
    addCompetition() {
      const form = this.newCompetition;
      if (!this.isValidCompetition(form)) return;
      const id = nextId(this.db.practice_competitions);
      this.db.practice_competitions.push({ id, created_at: timestampNow(), created_by: this.app.currentMemberId, name: form.name.trim(), start_date: form.startDate, end_date: form.endDate });
      this.selectedCompetitionId = id;
      this.notify(`«${form.name.trim()}» er opprettet.`);
      this.newCompetition = emptyCompetitionForm();
    },
    editCompetition(competition, event) {
      this.editedCompetition = { id: competition.id, name: competition.name, startDate: competition.start_date, endDate: competition.end_date, showErrors: false };
      this.openDrawer('Rediger konkurranse', competition.name, event);
    },
    saveCompetition() {
      const form = this.editedCompetition;
      if (!this.isValidCompetition(form)) return;
      const competition = this.db.practice_competitions.find(row => row.id === form.id);
      Object.assign(competition, { name: form.name.trim(), start_date: form.startDate, end_date: form.endDate });
      this.closeDrawer();
      this.notify(`«${competition.name}» er lagret.`);
    },
    deleteCompetition(competition) {
      this.db.practice_competitions = this.db.practice_competitions.filter(row => row.id !== competition.id);
      if (this.selectedCompetitionId === competition.id) this.selectedCompetitionId = (this.sortedCompetitions[0] || {}).id;
      this.confirmingDeleteId = null;
      this.notify(`«${competition.name}» er slettet.`);
    },
    saveWeeklyGoal() {
      const minutes = Math.round(Number(this.weeklyGoalMinutes));
      if (!(minutes >= 5 && minutes <= 1000)) { this.weeklyGoalError = 'Skriv inn et tall mellom 5 og 1000.'; this.focusFirstInvalidField(); return; }
      this.weeklyGoalError = '';
      const setting = this.db.settings.find(row => row.key === 'weekly_practice_goal_minutes');
      if (setting) Object.assign(setting, { value: minutes, updated_by: this.app.currentMemberId });
      else this.db.settings.push({ id: nextId(this.db.settings), created_at: timestampNow(), created_by: this.app.currentMemberId, updated_by: null, key: 'weekly_practice_goal_minutes', value: minutes });
      this.notify(`Ukemålet er satt til ${minutes} minutter.`);
    },
    deleteLog(log) {
      this.db.practice_logs = this.db.practice_logs.filter(row => row.id !== log.id);
      this.confirmingDeleteId = null;
      this.notify(`Registreringen på ${log.minutes} min er slettet.`);
    },
  });
}
