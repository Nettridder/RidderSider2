/* Global script for every page: data loading, the logged-in member, access rules, shared calculations,
   menu and layout, messages, reusable pieces and the admin tools.

   Where code goes:
   1. Used by one page only        -> a <script> / <style> section in that page's HTML.
   2. Used by pages in one category -> js/songs.js, js/members.js or js/documents.js (+ the matching css/ file).
   3. Used across categories        -> js/global.js / css/global.css.
   4. New page                      -> one HTML file + one line in MENU below.

   Every page loads css/global.css + js/global.js first, then its category file, then Alpine. */

/* ==================== Data, member and rules ==================== */

/* ==================== Theme (Mørk / Lys) ==================== */

/* Chosen in Profil -> Innstillinger -> Utseende and remembered on this device (localStorage).
   Every page's <head> has a one-line script that sets data-theme="light" before drawing, so it doesn't flash;
   the colours are in css/global.css under "Light theme". */
const THEME = {
  key: 'theme',
  get() { try { return localStorage.getItem(this.key) === 'light' ? 'light' : 'dark'; } catch (error) { return 'dark'; } },
  set(theme) {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(this.key, theme); } catch (error) { /* private browsing: works until the page is closed */ }
  },
};
document.documentElement.dataset.theme = THEME.get();

const PAGE_PATH = document.body.dataset.page || 'hjem';
const APP_ROOT = '../'.repeat(PAGE_PATH.split('/').length - 1);
const API_URL = APP_ROOT + '../api/';
const LOGO_URL = APP_ROOT + '../images/logoColor.png';
/* Pages that work without login. Every other page sends you to logg-inn.html. */
const PUBLIC_PAGES = ['logg-inn', 'nytt-passord'];

const LABELS = {
  voices: { T1: '1. tenor', T2: '2. tenor', T3: '3. tenor', B1: '1. bass', B2: '2. bass' },
  voiceGroups: ['T1', 'T2', 'B1', 'B2'],
  ranks: {
    aspirant: 'Aspirant', knekt: 'Knekt', ridder: 'Ridder', ridder_1st_class: 'Ridder av 1. klasse',
    kommandorridder: 'Kommandørridder', storridder: 'Storridder',
  },
  roles: { admin: 'Admin', noteadmin: 'Note Admin' },   // members.roles keys -> names shown
  statuses: { active: 'Aktiv', former: 'ypp.com.' },
  terms: { spring: 'Vår', autumn: 'Høst' },
  boardPositions: [
    { key: 'rittmester', label: 'Rittmester' },
    { key: 'paragrafrytter', label: 'Paragrafrytter' },
    { key: 'finansridder', label: 'Finansridder' },
    { key: 'noteridder', label: 'Noteridder' },
    { key: 'lagersjef', label: 'Lagersjef' },
    { key: 'dirigent', label: 'Dirigent' },
  ],
};

const KNOWLEDGE_LEVELS = [
  { value: 2, key: 'known', label: 'Kjent' },
  { value: 1, key: 'partly', label: 'Litt kjent' },
  { value: 0, key: 'unknown', label: 'Ikke kjent' },
];
const knowledgeLevel = value => KNOWLEDGE_LEVELS.find(level => level.value === value);

const MONTH_NAMES = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'];
const MONTH_SHORT = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
const DAY_NAMES = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];

const format = {
  capitalize: text => text ? text[0].toUpperCase() + text.slice(1) : '',
  number: value => Number(value).toLocaleString('nb-NO'),
  dateKey: date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
  parseDate: text => { const [y, m, d] = text.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); },
  longDate: date => `${format.capitalize(DAY_NAMES[date.getDay()])} ${date.getDate()}. ${MONTH_NAMES[date.getMonth()]}`,
  shortDate: date => `${format.capitalize(DAY_NAMES[date.getDay()].slice(0, 3))} ${date.getDate()}. ${MONTH_SHORT[date.getMonth()]}`,
  dayMonth: date => `${date.getDate()}. ${MONTH_SHORT[date.getMonth()]}`,
  fullDate: date => `${date.getDate()}. ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`,
  monthYear: date => `${format.capitalize(MONTH_NAMES[date.getMonth()])} ${date.getFullYear()}`,
  semester: (year, term) => year ? `${term === 'spring' ? 'V' : 'H'}${String(year).slice(-2)}` : '',
  semesterLong: (year, term) => year ? `${LABELS.terms[term]} ${year}` : '',
  memberPeriod: member => member.status === 'former'
    ? `${format.semester(member.joined_year, member.joined_term)}–${format.semester(member.left_year, member.left_term)}`
    : `Siden ${format.semester(member.joined_year, member.joined_term)}`,
  duration: seconds => { const s = Math.max(0, Math.floor(seconds || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; },
};

const addDays = (date, days) => { const copy = new Date(date); copy.setDate(copy.getDate() + days); return copy; };
const startOfWeek = date => addDays(date, -((date.getDay() + 6) % 7));
const isoWeekNumber = date => {
  const thursday = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7));
  return Math.ceil(((thursday - new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1))) / 864e5 + 1) / 7);
};
/* Media rule (same everywhere): a value starting with http is an external URL (YouTube, SmugMug) and is used
   as-is. Anything else is a path inside storage/, which lives outside the web root and is served by api/media.php. */
const storageUrl = path => /^https?:\/\//.test(path) ? path : API_URL + 'media.php?path=' + encodeURIComponent(path);

/* Song files: the database stores only the file name; these are the folders in storage/ they live in. */
const SONG_FOLDERS = { audio: 'songs/melody/', sheet: 'songs/pdf/', video: 'songs/video/' };
const songFileUrl = (kind, file) => !file ? '' : /^https?:\/\//.test(file) ? file : storageUrl(SONG_FOLDERS[kind] + file);

/* Pitch pipe: "E4 C4 G3" -> ['E4', 'C4', 'G3']. Accepts b/♭ and #/♯, e.g. "Bb3", "F#4". */
const NOTE_PATTERN = /^[A-G][♭b♯#]?\d$/;
const parseNotes = text => (text || '').split(/[\s,]+/).filter(Boolean);

/* ==================== Server API (PHP endpoints in /api) ==================== */

/* api.get('me.php') / api.post('login.php', {...}) -> parsed JSON.
   Throws an Error with the server's Norwegian message on failure. A 401 on a page that needs login
   means the login has ended (expired or removed by an admin), so go to the login page. */
const api = {
  async request(endpoint, options = {}) {
    const response = await fetch(API_URL + endpoint, { credentials: 'same-origin', ...options });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 && !PUBLIC_PAGES.includes(PAGE_PATH)) goToLogin();
    if (!response.ok) throw Object.assign(new Error(data.error || 'Noe gikk galt.'), { status: response.status });
    return data;
  },
  get(endpoint) { return this.request(endpoint) },
  post(endpoint, body = {}) {
    return this.request(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  },
};

function goToLogin() {
  const here = location.pathname + location.search + location.hash;
  location.replace(APP_ROOT + 'logg-inn.html?next=' + encodeURIComponent(here));
}

/* Only follow ?next= links that stay on this site, so the login page can't be used to send people elsewhere. */
function safeNextUrl(fallback = APP_ROOT + 'index.html') {
  const next = new URLSearchParams(location.search).get('next');
  if (!next) return fallback;
  const url = new URL(next, location.href);
  return url.origin === location.origin ? url.pathname + url.search + url.hash : fallback;
}

async function logOut() {
  await api.post('logout.php').catch(() => {});
  location.href = APP_ROOT + 'logg-inn.html';
}

/* Keepalive: check the login when the member comes back to the tab (no timer, the app is used in short visits).
   A valid check also extends the login on the server. */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !PUBLIC_PAGES.includes(PAGE_PATH)) api.get('me.php').catch(() => {});
});

document.addEventListener('alpine:init', () => {
  Alpine.store('ui', {
    toast: null,
    nestedMenu: [],
    notify(message, note = '') {
      this.toast = { message, note, id: Date.now() };
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => { this.toast = null; }, 4200);
    },
    /* Shows why saving failed (the server's message). The form stays as it was, so nothing typed is lost. */
    fail(error) { this.notify(error.message, 'Endringen ble ikke lagret.') },
  });

  Alpine.store('app', {
    ready: false,
    loadError: null,
    db: {},
    calendar: [],
    currentMemberId: null,
    today: new Date(),

    /* Loads everything the logged-in member may see from api/bootstrap.php (a 401 sends you to the login page).
       The calendar is optional: if it fails, the rest of the app still works. */
    async load() {
      try {
        const [me, database, calendar] = await Promise.all([
          api.get('me.php'),
          api.get('bootstrap.php'),
          Promise.resolve({ items: [] }),   // TODO: api/calendar.php (plan step 8) — empty calendar until then
        ]);
        this.currentMemberId = me.member.id;
        this.db = database;
        this.calendar = calendar.items.map(event => {
          const isAllDay = !event.start.dateTime;
          const start = event.start.dateTime || event.start.date;
          return { ...event, isAllDay, date: format.parseDate(start), dateKey: start.slice(0, 10), time: isAllDay ? '' : start.slice(11, 16), isPublic: event.visibility === 'public' };
        });
        this.ready = true;
      } catch (error) {
        this.loadError = error;
      }
    },

    /* ---------- saving (api/save.php) ----------
       Every change goes to the server first; the store is only updated with what the server actually saved.
       save(table, id, fields, children): id null = new row. children replace all child rows, e.g.
         save('songs', 12, { name: 'X' }, { song_genres: [{ genre_id: 3 }] })
       Both throw on failure (no access, invalid value, ...): catch and call $store.ui.fail(error). */
    async save(table, id, fields, children) {
      const result = await api.post('save.php', { action: id ? 'update' : 'insert', table, id, fields, children });
      const row = result.row;
      const existing = this.db[table].find(entry => entry.id === row.id);
      existing ? Object.assign(existing, row) : this.db[table].push(row);
      Object.entries(result.children).forEach(([childTable, { fk, rows }]) => {
        this.db[childTable] = this.db[childTable].filter(child => child[fk] !== row.id).concat(rows);
      });
      return existing || row;
    },
    async remove(table, id) {
      await api.post('save.php', { action: 'delete', table, id });
      this.db[table] = this.db[table].filter(row => row.id !== id);
    },

    /* ---------- the logged-in member and access ---------- */
    get me() { return this.member(this.currentMemberId) || {} },
    get isActiveMember() { return this.me.status === 'active' },
    hasRole(role) {
      const roles = this.me.roles || [];
      return roles.includes('admin') || roles.includes(role);   // Admin can do everything Note Admin can
    },
    canSee(access) {
      if (!access || access === 'all') return true;
      if (access === 'active') return this.isActiveMember;
      if (access === 'repertoire') return this.visibleRepertoires.length > 0;   // former members only when one is shown to them
      return this.hasRole(access);
    },

    /* ---------- members ---------- */
    member(id) { return (this.db.members || []).find(member => member.id === id) },
    memberName(member) { return member ? [member.first_name, member.last_name].filter(Boolean).join(' ') : '' },
    memberImage(member) { return storageUrl('images/profile/' + ((member && member.image_file) || 'portrett.png')) },
    memberSummary(member) { return member ? `${LABELS.voices[member.voice_group]} · ${LABELS.ranks[member.rank]}` : '' },
    get activeMembers() { return this.db.members.filter(member => member.status === 'active') },
    get formerMembers() { return this.db.members.filter(member => member.status === 'former') },

    /* ---------- songs ---------- */
    song(id) { return this.db.songs.find(song => song.id === id) },
    genre(id) { return this.db.genres.find(genre => genre.id === id) },
    songGenreIds(songId) { return this.db.song_genres.filter(link => link.song_id === songId).map(link => link.genre_id) },
    songGenreNames(songId) { return this.songGenreIds(songId).map(id => (this.genre(id) || {}).name).filter(Boolean).join(', ') },
    songFiles(songId) { return this.db.song_voice_files.filter(file => file.song_id === songId).sort((a, b) => a.sort_order - b.sort_order) },
    /* Sound files in the order Note Admin chose. */
    songAudioFiles(songId) { return this.songFiles(songId).filter(file => file.file) },
    /* The pitch pipe: the tones in playing order, and the time between them in seconds. */
    songStartNotes(songId) { return parseNotes((this.song(songId) || {}).pitch_notes).filter(note => NOTE_PATTERN.test(note)) },
    songNoteGap(songId) { return ((this.song(songId) || {}).pitch_gap_ms || 800) / 1000 },
    /* Songs in the repertoires this member can open (for former members: only those not hidden for ypp.com.). */
    get songIdsInVisibleRepertoires() {
      const visibleIds = (this.db.repertoires || []).filter(repertoire => repertoire.is_visible && (this.isActiveMember || !repertoire.hidden_for_former)).map(repertoire => repertoire.id);
      return new Set((this.db.repertoire_songs || []).filter(link => visibleIds.includes(link.repertoire_id)).map(link => link.song_id));
    },
    canSeeSong(song) {
      if (!song) return false;
      if (!song.is_secret) return true;
      return this.songIdsInVisibleRepertoires.has(song.id);
    },
    get visibleSongs() {
      return this.db.songs.filter(song => this.canSeeSong(song)).sort((a, b) => a.name.localeCompare(b.name, 'nb'));
    },

    /* ---------- song knowledge (member_songs: no row = ikke kjent) ---------- */
    memberSong(songId, memberId = this.currentMemberId) {
      return this.db.member_songs.find(row => row.song_id === songId && row.member_id === memberId);
    },
    knowledgeOf(songId, memberId = this.currentMemberId) { return (this.memberSong(songId, memberId) || {}).knowledge || 0 },
    isFavorite(songId) { return !!(this.memberSong(songId) || {}).is_favorite },
    setKnowledge(songId, knowledge) { return this.updateMemberSong(songId, { knowledge }) },
    toggleFavorite(songId) { return this.updateMemberSong(songId, { is_favorite: !this.isFavorite(songId) }) },
    /* member_songs is sparse: a row only exists while knowledge > 0 or it is a favourite. */
    async updateMemberSong(songId, changes) {
      const row = this.memberSong(songId);
      const next = { knowledge: 0, is_favorite: false, ...row, ...changes };
      try {
        if (!next.knowledge && !next.is_favorite) { if (row) await this.remove('member_songs', row.id); }
        else await this.save('member_songs', row && row.id, row ? changes : { song_id: songId, ...changes });
      } catch (error) {
        Alpine.store('ui').fail(error);
      }
    },
    knownSongCount(memberId = this.currentMemberId) {
      return this.db.member_songs.filter(row => row.member_id === memberId && row.knowledge === 2).length;
    },

    /* ---------- repertoires ---------- */
    /* Active members: the visible ones (Note Admin: all). Former members (ypp.com.): visible ones not hidden for them. */
    get visibleRepertoires() {
      if (!this.ready) return [];   // the menu asks before the data has loaded
      if (!this.isActiveMember) return this.db.repertoires.filter(repertoire => repertoire.is_visible && !repertoire.hidden_for_former);
      return this.db.repertoires.filter(repertoire => repertoire.is_visible || this.hasRole('noteadmin'));
    },
    repertoireSongIds(repertoireId) {
      return this.db.repertoire_songs.filter(link => link.repertoire_id === repertoireId).sort((a, b) => a.sort_order - b.sort_order).map(link => link.song_id);
    },

    /* ---------- practice ---------- */
    get weeklyGoal() { return this.setting('weekly_practice_goal_minutes') || 60 },
    practiceLogs(memberId) { return this.db.practice_logs.filter(log => log.member_id === memberId) },
    totalMinutes(memberId = this.currentMemberId) { return this.practiceLogs(memberId).reduce((sum, log) => sum + log.minutes, 0) },
    minutesThisWeek(memberId = this.currentMemberId) {
      const from = format.dateKey(startOfWeek(this.today)), to = format.dateKey(this.today);
      return this.practiceLogs(memberId).filter(log => log.date >= from && log.date <= to).reduce((sum, log) => sum + log.minutes, 0);
    },
    currentStreak(memberId = this.currentMemberId) {
      const days = new Set(this.practiceLogs(memberId).map(log => log.date));
      let day = days.has(format.dateKey(this.today)) ? this.today : addDays(this.today, -1);
      let streak = 0;
      while (days.has(format.dateKey(day))) { streak++; day = addDays(day, -1); }
      return streak;
    },
    hasPracticedToday(memberId = this.currentMemberId) {
      const today = format.dateKey(this.today);
      return this.practiceLogs(memberId).some(log => log.date === today);
    },
    logPractice(minutes) { return this.save('practice_logs', null, { date: format.dateKey(this.today), minutes }) },
    get leaderboard() {
      const rows = this.activeMembers.map(member => ({ member, streak: this.currentStreak(member.id), total: this.totalMinutes(member.id) }));
      return {
        longestStreak: [...rows].sort((a, b) => b.streak - a.streak)[0],
        mostPractice: [...rows].sort((a, b) => b.total - a.total)[0],
      };
    },

    /* ---------- achievements ---------- */
    achievementsFor(memberId = this.currentMemberId) {
      return [...this.db.achievements].sort((a, b) => a.sort_order - b.sort_order).map(achievement => {
        const earned = this.db.member_achievements.find(row => row.member_id === memberId && row.achievement_id === achievement.id);
        return { ...achievement, earnedAt: earned ? format.parseDate(earned.created_at) : null };
      });
    },
    earnedAchievementCount(memberId = this.currentMemberId) {
      return this.db.member_achievements.filter(row => row.member_id === memberId).length;
    },

    /* ---------- calendar (Google Calendar) ---------- */
    get calendarEvents() { return this.calendar.filter(event => this.isActiveMember || event.isPublic) },
    get upcomingEvents() {
      const today = format.dateKey(this.today);
      return this.calendarEvents.filter(event => event.dateKey >= today);
    },

    /* ---------- board, documents, settings ---------- */
    get boardsNewestFirst() {
      return [...this.db.boards].sort((a, b) => b.year - a.year || (b.term === 'autumn') - (a.term === 'autumn'));
    },
    get currentBoard() { return this.boardsNewestFirst[0] },
    get documentsNewestFirst() { return [...this.db.documents].sort((a, b) => b.created_at.localeCompare(a.created_at)) },
    setting(key) { return (this.db.settings.find(row => row.key === key) || {}).value },
  });

  if (!PUBLIC_PAGES.includes(PAGE_PATH)) Alpine.store('app').load();
});

/* ==================== Menu and layout (the menu list is also the folder structure) ==================== */

const MENU = [
  { key: 'hjem', label: 'Hjem', href: 'index.html' },
  {
    key: 'noter', label: 'Noter',
    items: [
      { page: 'noter/sanger', label: 'Sanger' },
      { page: 'noter/repertoar', label: 'Repertoar', access: 'repertoire' },
      { page: 'noter/ovingsplan', label: 'Øvingsplan', access: 'active' },
      { page: 'noter/toneangiver', label: 'Toneangiver' },
    ],
    admin: {
      label: 'Note Admin', access: 'noteadmin',
      items: [
        { page: 'noter/admin/sanger', label: 'Sanger' },
        { page: 'noter/admin/repertoar', label: 'Repertoar' },
        { page: 'noter/admin/sangkunnskap', label: 'Sangkunnskap' },
        { page: 'noter/admin/ovingsplan', label: 'Øvingsplan' },
        { page: 'noter/admin/ovingskonkurranse', label: 'Øvingskonkurranse' },
      ],
    },
  },
  {
    key: 'medlemmer', label: 'Medlemmer',
    items: [
      { page: 'medlemmer/medlemmer', label: 'Medlemmer' },
      { page: 'medlemmer/styret', label: 'Styret' },
    ],
    admin: {
      label: 'Admin', access: 'admin',
      items: [
        { page: 'admin/medlemmer', label: 'Medlemmer' },
        { page: 'admin/styret', label: 'Styret' },
        { page: 'admin/opptellinger', label: 'Opptellinger' },
        { page: 'admin/dokumenter', label: 'Dokumenter' },
        { page: 'admin/resolusjonar', label: 'Resolusjonar' },
        { page: 'admin/bakgrunnsbilete', label: 'Bakgrunnsbilete' },
        { page: 'admin/achievements', label: 'Achievements' },
      ],
    },
  },
  {
    key: 'ridderdata', label: 'Ridderdata',
    items: [
      { page: 'ridderdata/kalender', label: 'Kalender' },
      { page: 'ridderdata/dokumenter', label: 'Dokumenter' },
      { external: '/ridderwiki', label: 'RidderWiki' },
      { external: '/ridderwiki/Videoarkiv', label: 'Videoarkiv' },
      { external: 'https://armeriddere.smugmug.com', label: 'Bildearkiv' },
    ],
  },
  {
    key: 'kontakt', label: 'Kontakt',
    items: [
      { page: 'kontakt/epostlister', label: 'Epostlister' },
      { page: 'kontakt/forum', label: 'Anonym Forum' },
    ],
  },
];

/* Pages reached from the profile button, not the main menu. */
const PROFILE_SECTION = {
  key: 'profil', label: 'Profil',
  items: [
    { page: 'profil/profil', label: 'Profil' },
    { page: 'profil/achievements', label: 'Achievements' },
    { page: 'profil/innstillinger', label: 'Innstillinger' },
  ],
};

/* Pages that are not in a menu, shown under a menu item. */
const PAGES_OUTSIDE_MENU = {
  'noter/sang': { parent: 'noter/sanger', label: 'Sang' },
};

const CHOIR_NAME = 'Mannskoret Arme Riddere';
const pageHref = page => APP_ROOT + (page === 'hjem' ? 'index' : page) + '.html';

function findCurrentPlace() {
  const lookup = PAGES_OUTSIDE_MENU[PAGE_PATH];
  const path = lookup ? lookup.parent : PAGE_PATH;
  for (const section of [...MENU, PROFILE_SECTION]) {
    if (section.key === path) return { section, item: section, isAdmin: false };
    const item = (section.items || []).find(entry => entry.page === path);
    if (item) return { section, item, isAdmin: false, label: lookup && lookup.label };
    const adminItem = section.admin && section.admin.items.find(entry => entry.page === path);
    if (adminItem) return { section, item: adminItem, isAdmin: true };
  }
  return { section: MENU[0], item: MENU[0], isAdmin: false };
}
const CURRENT = findCurrentPlace();
const PAGE_ACCESS = CURRENT.isAdmin ? CURRENT.section.admin.access : CURRENT.item.access;

if (PAGE_PATH !== 'logg-inn') document.title = `${CURRENT.isAdmin ? CURRENT.section.admin.label + ': ' : ''}${CURRENT.label || CURRENT.item.label} – ${CHOIR_NAME}`;

function siteLayout() {
  return {
    menu: MENU,
    current: CURRENT,
    profileMenuOpen: false,
    menusOpen: localStorage.getItem('menusOpen') !== 'false',
    pageHref,
    get app() { return this.$store.app },
    get visibleItems() { return (this.current.section.items || []).filter(item => this.app.canSee(item.access)) },
    get showAdminLink() { return this.current.section.admin && this.app.canSee(this.current.section.admin.access) },
    get showAdminMenu() { return this.current.isAdmin && this.showAdminLink },
    firstPageOf(section) {
      if (section.href) return APP_ROOT + section.href;
      const first = section.items.find(item => item.page && this.app.canSee(item.access));
      return pageHref(first.page);
    },
    isCurrentPage(item) { return !!item.page && (item.page === PAGE_PATH || item.page === (PAGES_OUTSIDE_MENU[PAGE_PATH] || {}).parent) },
    toggleProfileMenu() {
      this.profileMenuOpen = !this.profileMenuOpen;
      if (this.profileMenuOpen) this.$nextTick(() => this.$refs.profileMenu.querySelector('a, button').focus());
    },
    moveFocusInProfileMenu(step) {
      const items = [...this.$refs.profileMenu.querySelectorAll('a, button')];
      const index = items.indexOf(document.activeElement);
      items[(index + step + items.length) % items.length].focus();
    },
    init() {
      this.$nextTick(() => requestAnimationFrame(() => {
        document.querySelectorAll('.sub-menu .sub-menu__link.is-active').forEach(link => {
          const strip = link.closest('.sub-menu__inner');
          if (strip && strip.scrollWidth > strip.clientWidth) strip.scrollLeft = link.offsetLeft - strip.clientWidth / 2 + link.offsetWidth / 2;
        });
      }));
    },
    closeMenus() {
      if (this.profileMenuOpen) { this.profileMenuOpen = false; this.$refs.profileButton.focus(); }
    },
    toggleMenus() { this.menusOpen = !this.menusOpen; localStorage.setItem('menusOpen', this.menusOpen); },
  };
}

function canSeeThisPage() { return Alpine.store('app').canSee(PAGE_ACCESS) }

const ICONS = {
  hjem: '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M4 10.5 12 4l8 6.5V20h-5.2v-5.5H9.2V20H4z"/>',
  noter: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17.5V5.5l10-2v12"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/></g>',
  medlemmer: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="8" r="3.3"/><path d="M3 20c.4-3.4 2.9-5.6 6-5.6s5.6 2.2 6 5.6"/><path d="M15.5 4.9a3.2 3.2 0 0 1 0 6.2M17.6 14.6c1.9.7 3.2 2.6 3.4 5.4"/></g>',
  ridderdata: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><rect x="3" y="4" width="18" height="5" rx="1.2"/><path d="M5 9v10.5h14V9M10 13h4"/></g>',
  kontakt: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.8 7 12 13l8.2-6"/></g>',
};

const ICON_SPRITE = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="icon-external" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M8 16 16 8M9.5 8H16v6.5"/></symbol>
  <symbol id="icon-play" viewBox="0 0 24 24"><path fill="currentColor" d="M7 4.5v15l12.5-7.5z"/></symbol>
  <symbol id="icon-pause" viewBox="0 0 24 24"><path fill="currentColor" d="M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z"/></symbol>
  <symbol id="icon-back-10" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/></g></symbol>
  <symbol id="icon-forward-10" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v4h-4"/></g></symbol>
  <symbol id="icon-flame" viewBox="0 0 96 112"><path fill="currentColor" d="M48 4c4 17 30 29 30 62a30 30 0 0 1-60 0c0-14 7-23 14-29 0 12 5 18 11 20C40 43 38 26 48 4z"/></symbol>
  <symbol id="icon-download" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M5 19.5h14"/></symbol>
  <symbol id="icon-check" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" d="M5 12.5 10 17 19 7"/></symbol>
  <symbol id="icon-left" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M15 5 8 12l7 7"/></symbol>
  <symbol id="icon-right" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="m9 5 7 7-7 7"/></symbol>
  <symbol id="icon-up" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="m5 15 7-7 7 7"/></symbol>
  <symbol id="icon-down" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="m5 9 7 7 7-7"/></symbol>
  <symbol id="icon-close" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></symbol>
  <symbol id="icon-calendar" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></g></symbol>
  <symbol id="icon-heart" viewBox="0 0 24 24"><path fill="currentColor" d="M12 20.3 4.6 13a4.7 4.7 0 0 1 6.6-6.7l.8.8.8-.8a4.7 4.7 0 0 1 6.6 6.7z"/></symbol>
  <symbol id="icon-sheet" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></g></symbol>
  <symbol id="icon-audio" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2"/></g></symbol>
  <symbol id="icon-video" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/></g></symbol>
  <symbol id="icon-medal" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M8 3h8l-2 6h-4z"/><circle cx="12" cy="15" r="6"/><path d="m12 12 .9 1.9 2.1.3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2-1.5-1.4 2.1-.3z" fill="currentColor"/></g></symbol>
  ${Object.entries(ICONS).map(([key, paths]) => `<symbol id="icon-${key}" viewBox="0 0 24 24">${paths}</symbol>`).join('')}
</svg>`;

const SITE_HEADER = `
<div x-data="siteLayout()" @keydown.escape.window="closeMenus()">
  <header class="site-header">
    <div class="container site-header__inner">
      <a class="brand" :href="pageHref('hjem')">
        <img class="brand__logo" src="${LOGO_URL}" alt="">
        <span class="brand__name">Mannskoret <span class="brand__name-line">Arme Riddere</span></span>
      </a>
      <div class="profile" @click.outside="profileMenuOpen = false">
        <button class="profile-button" x-ref="profileButton" type="button" aria-haspopup="true" :aria-expanded="profileMenuOpen" aria-controls="profile-menu"
                @click="toggleProfileMenu()" @keydown.down.prevent="profileMenuOpen || toggleProfileMenu()">
          <span>
            <span class="profile-button__name" x-text="app.memberName(app.me)"></span>
            <span class="profile-button__details" x-text="app.isActiveMember ? app.memberSummary(app.me) : (app.me.rank ? LABELS.ranks[app.me.rank] + ' · ypp.com.' : '')"></span>
          </span>
          <span class="portrait"><img :src="app.memberImage(app.me)" alt=""></span>
        </button>
        <ul class="profile-menu" id="profile-menu" x-ref="profileMenu" x-show="profileMenuOpen" x-cloak
            @keydown.down.prevent="moveFocusInProfileMenu(1)" @keydown.up.prevent="moveFocusInProfileMenu(-1)" @keydown.tab="profileMenuOpen = false">
          <li><a class="profile-menu__link" :href="pageHref('profil/profil')">Vis profil</a></li>
          <li><a class="profile-menu__link" :href="pageHref('profil/achievements')">Achievements</a></li>
          <li><a class="profile-menu__link" :href="pageHref('profil/innstillinger')">Innstillinger</a></li>
          <li class="profile-menu__divider" role="presentation"></li>
          <li><button class="profile-menu__link profile-menu__link--quiet" type="button" @click="logOut()">Logg ut</button></li>
        </ul>
      </div>
    </div>
  </header>

  <nav class="main-menu" x-show="menusOpen" aria-label="Hovedmeny">
    <div class="container">
      <ul class="main-menu__list">
        <template x-for="section in menu" :key="section.key">
          <li>
            <a class="main-menu__link" :class="current.section.key === section.key && 'is-active'" :href="firstPageOf(section)"
               :aria-current="current.section.key === section.key ? 'page' : null">
              <svg class="main-menu__icon" aria-hidden="true"><use :href="'#icon-' + section.key"/></svg>
              <span x-text="section.label"></span>
            </a>
          </li>
        </template>
        <li style="position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%);">
          <button class="main-menu__close" @click="toggleMenus()" type="button" aria-label="Skjul meny">
            <svg aria-hidden="true"><use href="#icon-down"/></svg>
          </button>
        </li>
      </ul>
    </div>
  </nav>

  <template x-if="current.section.items">
    <nav class="sub-menu" x-show="menusOpen" :aria-label="'Undermeny ' + current.section.label">
      <div class="container">
        <div class="sub-menu__inner" x-show="!showAdminMenu">
          <ul class="sub-menu__links">
            <template x-for="item in visibleItems" :key="item.label">
              <li>
                <a class="sub-menu__link" :class="isCurrentPage(item) && 'is-active'" :aria-current="isCurrentPage(item) ? 'page' : null"
                   :href="item.external || pageHref(item.page)" :target="item.external ? '_blank' : null" :rel="item.external ? 'noopener' : null">
                  <span x-text="item.label"></span>
                  <svg class="sub-menu__external-icon" x-show="item.external" aria-label="åpnes i ny fane"><use href="#icon-external"/></svg>
                </a>
              </li>
            </template>
          </ul>
          <div class="sub-menu__admin" x-show="showAdminLink">
            <a :href="current.section.admin && pageHref(current.section.admin.items[0].page)" x-text="current.section.admin && current.section.admin.label"></a>
          </div>
        </div>
        <div class="sub-menu__inner" x-show="showAdminMenu">
          <a class="sub-menu__back" :href="firstPageOf(current.section)"><svg aria-hidden="true"><use href="#icon-left"/></svg><span x-text="current.section.label"></span></a>
          <span class="badge sub-menu__label" x-text="current.section.admin && current.section.admin.label"></span>
          <ul class="sub-menu__links">
            <template x-for="item in (current.section.admin ? current.section.admin.items : [])" :key="item.page">
              <li><a class="sub-menu__link" :class="item.page === '${PAGE_PATH}' && 'is-active'" :href="pageHref(item.page)" x-text="item.label"></a></li>
            </template>
          </ul>
        </div>
      </div>
    </nav>
  </template>

  <nav class="sub-menu sub-menu--nested" x-show="menusOpen && $store.ui.nestedMenu.length" x-cloak aria-label="Velg liste"
       x-effect="document.body.classList.toggle('has-nested-menu', menusOpen && $store.ui.nestedMenu.length > 0)">
    <div class="container">
      <div class="sub-menu__inner">
        <ul class="sub-menu__links">
          <template x-for="item in $store.ui.nestedMenu" :key="item.href">
            <li>
              <a class="sub-menu__link" :class="item.isActive && 'is-active'" :aria-current="item.isActive ? 'page' : null" :href="item.href">
                <span x-text="item.label"></span><span class="badge badge--muted" x-show="item.badge" x-text="item.badge"></span>
              </a>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </nav>

  <button class="menu-toggle" x-show="!menusOpen" @click="toggleMenus()" type="button" aria-label="Vis meny">
    <svg aria-hidden="true"><use href="#icon-up"/></svg>
  </button>
</div>`;

const PAGE_STATES = `
<p class="loading-state" x-show="!$store.app.ready && !$store.app.loadError">Laster …</p>
<div class="access-notice" x-show="$store.app.loadError" x-cloak>
  <h1>Kunne ikke hente dataene</h1>
  <p x-text="$store.app.loadError && $store.app.loadError.message"></p>
  <p>Last siden på nytt. Hjelper ikke det, si fra til Nettridder.</p>
</div>
<template x-if="$store.app.ready && !canSeeThisPage()">
  <div class="access-notice">
    <h1 x-text="PAGE_ACCESS === 'active' ? 'Bare for aktive medlemmer' : 'Bare for administratorer'"></h1>
    <p x-text="PAGE_ACCESS === 'active' ? 'Denne siden er for aktive medlemmer. Sanger, kalender og dokumenter finner du fortsatt i menyen.' : 'Denne siden krever en egen rolle. Be styret om tilgang hvis du trenger den.'"></p>
    <a class="button button--secondary" href="${pageHref('hjem')}">Til Hjem</a>
  </div>
</template>`;

const TOAST = `
<div x-data>
  <template x-if="$store.ui.toast">
    <div class="toast" role="status" :key="$store.ui.toast.id">
      <div>
        <p class="toast__message" x-text="$store.ui.toast.message"></p>
        <p class="toast__note" x-show="$store.ui.toast.note" x-text="$store.ui.toast.note"></p>
      </div>
    </div>
  </template>
</div>`;

function buildLayout() {
  document.head.insertAdjacentHTML('beforeend', `<link rel="icon" href="${LOGO_URL}">`);
  if (PUBLIC_PAGES.includes(PAGE_PATH)) return;
  const main = document.querySelector('main');
  const pageContent = main.innerHTML;
  main.className = 'page';
  main.setAttribute('x-data', '');
  main.innerHTML = `<div class="container">${PAGE_STATES}<template x-if="$store.app.ready && canSeeThisPage()"><div>${pageContent}</div></template></div>`;
  document.body.insertAdjacentHTML('afterbegin', ICON_SPRITE + SITE_HEADER);
  document.body.insertAdjacentHTML('beforeend', TOAST);
}

/* ==================== Admin tools: reusable forms, edit drawer, confirm step ==================== */

function prepareAdminMarkup() {
  (function fillFormTemplates(root) {
    root.querySelectorAll('template').forEach(template => { if (!template.id) fillFormTemplates(template.content); });
    root.querySelectorAll('[data-form-template]').forEach(element => {
      const [templateId, formVariable, idPrefix] = element.dataset.formTemplate.split(':');
      element.innerHTML = document.getElementById(templateId).innerHTML
        .replaceAll('FORM.', formVariable + '.').replaceAll('FORM)', formVariable + ')').replaceAll('ID-', idPrefix + '-');
      element.removeAttribute('data-form-template');
      fillFormTemplates(element);
    });
  })(document);

  document.querySelectorAll('[data-edit-drawer]').forEach(element => {
    element.outerHTML = `
<div class="drawer" x-show="drawerOpen" x-cloak @keydown.tab="keepFocusInDrawer($event)" @keydown.escape.window="drawerOpen && (confirmingDelete ? confirmingDelete = false : closeDrawer())">
  <div class="overlay-backdrop" @click="closeDrawer()" aria-hidden="true"></div>
  <aside class="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title" x-ref="drawerPanel">
    <div class="dialog-header">
      <h2 id="drawer-title"><span x-text="drawerTitle"></span><small x-text="drawerSubtitle"></small></h2>
      <button class="close-button" type="button" x-ref="drawerCloseButton" @click="closeDrawer()">Lukk</button>
    </div>
    ${element.innerHTML}
  </aside>
</div>`;
  });
}

function adminTools() {
  return {
    search: '',
    drawerOpen: false,
    drawerTitle: '',
    drawerSubtitle: '',
    confirmingDelete: false,
    confirmingDeleteId: null,
    rowKey: 0,
    get app() { return this.$store.app },
    get db() { return this.$store.app.db },
    matchesSearch(...texts) {
      const query = this.search.trim().toLowerCase();
      return !query || texts.join(' ').toLowerCase().includes(query);
    },
    notify(message) { this.$store.ui.notify(message) },
    fail(error) { this.$store.ui.fail(error) },
    toggleInList(list, value) { const index = list.indexOf(value); index < 0 ? list.push(value) : list.splice(index, 1); },
    focusFirstInvalidField() { this.$nextTick(() => { const field = document.querySelector('[aria-invalid="true"]'); field && field.focus(); }); },
    openDrawer(title, subtitle, event) {
      this.drawerOpener = event && event.currentTarget;
      this.drawerTitle = title;
      this.drawerSubtitle = subtitle || '';
      this.confirmingDelete = false;
      this.drawerOpen = true;
      document.documentElement.style.overflow = 'hidden';
      this.$nextTick(() => requestAnimationFrame(() => this.$refs.drawerCloseButton.focus()));
    },
    closeDrawer(returnFocus = true) {
      this.drawerOpen = false;
      this.confirmingDelete = false;
      document.documentElement.style.overflow = '';
      if (returnFocus && this.drawerOpener && this.drawerOpener.isConnected) this.drawerOpener.focus();
    },
    keepFocusInDrawer(event) {
      const focusable = [...this.$refs.drawerPanel.querySelectorAll('a[href], button:not([disabled]), input:not([type=file]), select, textarea')].filter(element => element.getClientRects().length);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    },
  };
}

function withAdminTools(page) {
  const component = Object.defineProperties({}, Object.getOwnPropertyDescriptors(adminTools()));
  return Object.defineProperties(component, Object.getOwnPropertyDescriptors(page));
}

/* ==================== Search field instead of a dropdown ==================== */

/* For choosing one item from a long list (songs, members). Use it like this:
     <div x-data="searchSelect({ items: () => listOfItems, get: () => currentId, set: id => currentId = id,
                                label: item => item.name, empty: 'Ikke satt' })"><div data-piece="search-select"></div></div>
   - Type to filter; click a match or press Enter for the first one.
   - empty (optional): adds a choice for "none" at the top, e.g. 'Ikke satt'. Without it there is no empty choice.
   - The field shows the chosen item's name when you are not typing. */
function searchSelect({ items, get, set, label, empty = null, placeholder = 'Søk …' }) {
  return {
    query: '',
    open: false,
    placeholder,
    get selected() { return items().find(item => item.id === get()) || null },
    get selectedLabel() { return this.selected ? label(this.selected) : '' },
    get matches() {
      const query = this.query.trim().toLowerCase();
      const found = items().filter(item => !query || label(item).toLowerCase().includes(query)).slice(0, 30);
      return empty !== null && !query ? [{ id: '', isEmpty: true }, ...found] : found;
    },
    itemLabel(item) { return item.isEmpty ? empty : label(item) },
    focus() { this.query = ''; this.open = true; },
    pick(item) {
      if (!item) return;
      set(item.isEmpty ? '' : item.id);
      this.query = '';
      this.open = false;
    },
    close() { this.open = false; this.query = ''; },
  };
}

const SEARCH_SELECT_PIECE = `
<div class="search-select" @click.outside="close()" @keydown.escape.stop="close()">
  <input class="input search-select__input" type="search" autocomplete="off" x-model="query"
         :placeholder="selectedLabel || placeholder" :class="selectedLabel && 'search-select__input--chosen'"
         @focus="focus()" @click="open = true" @input="open = true" @keydown.enter.prevent="pick(matches.find(item => !item.isEmpty) || matches[0])"
         :aria-label="'Søk og velg' + (selectedLabel ? ', valgt: ' + selectedLabel : '')">
  <ul class="search-select__results" x-show="open" x-cloak>
    <template x-for="item in matches" :key="item.id">
      <li><button type="button" class="search-select__result" :class="item.id === (selected && selected.id) && 'is-chosen'" @mousedown.prevent @click="pick(item)" x-text="itemLabel(item)"></button></li>
    </template>
    <li class="search-select__none" x-show="!matches.length">Ingen treff</li>
  </ul>
</div>`;

/* ==================== Pieces and page start ==================== */

/* Reusable markup: a category file registers a piece, a page uses it with <div data-piece="name"></div>. */
const PAGE_PIECES = {};
function registerPiece(name, markup) { PAGE_PIECES[name] = markup; }
registerPiece('search-select', SEARCH_SELECT_PIECE);
function insertPieces(root = document) {
  root.querySelectorAll('template').forEach(template => insertPieces(template.content));
  root.querySelectorAll('[data-piece]').forEach(element => {
    element.outerHTML = PAGE_PIECES[element.dataset.piece] || '';
  });
}

/* Before Alpine reads the page: fill in pieces and admin forms, then add header, menus and notices. */
document.addEventListener('alpine:init', () => {
  insertPieces();
  prepareAdminMarkup();
  buildLayout();
});
