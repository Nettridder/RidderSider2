/* Documents: document reader, document and resolution lists, backgrounds, and their admin pages. */

/* ==================== Shared: document reader ==================== */

const DOCUMENT_PREVIEWS = {
  'styrereferat-2026-09-18.pdf': `
    <h3>Referat fra styremøte</h3>
    <p class="paper__meta">Fredag 18. september 2026, kl. 18:00, øvingslokalet i Johanneskirken. Til stede: Erik Moe (Rittmester), Anders Lie (Paragrafrytter), Kristian Hafell (Finansridder), Lars Berg (Noteridder) og Ole Bakke (Lagersjef).</p>
    <h4><span>Sak 23/26</span>Høstkonserten</h4>
    <p>Universitetsaulaen er bekreftet for lørdag 7. november kl. 18:00. Programmet er lagt ut som repertoar i appen. Generalprøve torsdag 5. november.</p>
    <p class="paper__decision">Vedtak: Styret godkjenner programmet og billettprisen på 200 kr.</p>
    <h4><span>Sak 24/26</span>Opptreden i Grieghallen</h4>
    <p>Mannskoret Arme Riddere synger i foajeen lørdag 3. oktober kl. 14:00. Oppmøte 13:15 ved artistinngangen. Antrekk: mørk dress og kortet slips.</p>
    <h4><span>Sak 25/26</span>Julekonserten</h4>
    <p>Johanneskirken lørdag 12. desember kl. 19:00. Billettsalget åpner 1. november.</p>
    <h4><span>Sak 26/26</span>Økonomi</h4>
    <p>Finansridderen la frem regnskapet per august. Kontingenten er betalt av 41 av 46 aktive. Påminnelse sendes de resterende.</p>
    <h4><span>Sak 27/26</span>Eventuelt</h4>
    <p>Øvingsappen er tatt i bruk. Styret oppfordrer alle til å registrere øving og markere hvilke sanger de kan. Ukemålet er 60 minutter.</p>
    <p class="paper__signature">Neste styremøte: torsdag 22. oktober 2026.<br>Referent: Anders Lie, Paragrafrytter</p>`,
};

function documentReader() {
  return {
    isOpen: false,
    document: null,
    get app() { return this.$store.app },
    get preview() { return this.document && DOCUMENT_PREVIEWS[this.document.file] },
    get fileType() { return this.document ? this.document.file.split('.').pop().toUpperCase() : '' },
    open(event) {
      this.opener = event.target.closest('button, a');
      this.document = this.app.db.documents.find(doc => doc.id === event.detail.id);
      this.isOpen = true;
      document.documentElement.style.overflow = 'hidden';
      this.$nextTick(() => requestAnimationFrame(() => this.$refs.closeButton.focus()));
    },
    close() {
      this.isOpen = false;
      document.documentElement.style.overflow = '';
      if (this.opener && this.opener.isConnected) this.opener.focus();
    },
    keepFocusInside(event) {
      const focusable = [...this.$refs.dialog.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]')];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    },
  };
}

document.body.insertAdjacentHTML('beforeend', `
<div x-data="documentReader()" @open-document.window="open($event)" @keydown.escape.window="isOpen && close()">
  <div class="document-reader" x-show="isOpen" x-cloak @keydown.tab="keepFocusInside($event)">
    <div class="overlay-backdrop" @click="close()" aria-hidden="true"></div>
    <div class="document-reader__dialog" role="dialog" aria-modal="true" aria-labelledby="document-title" x-ref="dialog">
      <div class="dialog-header">
        <h2 id="document-title"><span x-text="document && document.title"></span>
          <small x-text="document ? 'Lagt ut av ' + app.memberName(app.member(document.created_by)) + ', ' + format.fullDate(format.parseDate(document.created_at)) : ''"></small></h2>
        <button class="close-button" type="button" x-ref="closeButton" @click="close()">Lukk</button>
      </div>
      <div class="document-reader__body" tabindex="0" aria-label="Dokumentets innhold">
        <article class="paper" x-show="preview" x-html="preview"></article>
        <p class="empty-state document-reader__missing" x-show="!preview">Forhåndsvisning er ikke tilgjengelig i demoen. Last ned filen for å lese den.</p>
      </div>
      <div class="document-reader__footer">
        <p class="hint" x-text="fileType"></p>
        <a class="button button--secondary" :href="document ? '/app/dokumenter/' + document.file : '#'" download><svg aria-hidden="true"><use href="#icon-download"/></svg>Last ned</a>
      </div>
    </div>
  </div>
</div>`);

/* ==================== Dokumenter (ridderdata/dokumenter) ==================== */

function documentsPage() {
  return {
    tab: 'documents',
    search: '',
    sortOrder: 'newest',
    get app() { return this.$store.app },
    get documents() {
      const query = this.search.trim().toLowerCase();
      const list = this.app.documentsNewestFirst.filter(doc => !query || doc.title.toLowerCase().includes(query));
      if (this.sortOrder === 'oldest') return list.reverse();
      if (this.sortOrder === 'title') return list.sort((a, b) => a.title.localeCompare(b.title, 'nb'));
      return list;
    },
    get resolutionsBySemester() {
      const groups = {};
      [...this.app.db.resolutions]
        .sort((a, b) => b.year - a.year || (b.term === 'autumn') - (a.term === 'autumn') || a.created_at.localeCompare(b.created_at))
        .forEach(resolution => {
          const key = resolution.year + resolution.term;
          groups[key] = groups[key] || { key, name: format.semesterLong(resolution.year, resolution.term), resolutions: [] };
          groups[key].resolutions.push(resolution);
        });
      return Object.values(groups);
    },
    fileType(doc) { return doc.file.split('.').pop().toUpperCase() },
  };
}

/* ==================== Admin: Dokumenter (admin/dokumenter) ==================== */

function adminDocumentsPage() {
  return withAdminTools({
    newDocument: null,
    editedDocument: null,
    init() {
      this.newDocument = this.emptyDocument();
      this.editedDocument = this.emptyDocument();
    },
    emptyDocument() { return { id: null, title: '', file: '', new_file: '', submitted: false } },
    get listedDocuments() { return this.app.documentsNewestFirst.filter(document => this.matchesSearch(document.title, document.file)) },
    fileType(file) { return (file.split('.').pop() || '').toUpperCase() },
    documentErrors(form) {
      const errors = {};
      if (!form) return errors;
      if (!form.title.trim()) errors.title = 'Gi dokumentet en tittel.';
      const file = form.new_file || form.file;
      if (!file) errors.file = 'Velg en fil å laste opp.';
      else if (!/\.(pdf|docx?)$/i.test(file)) errors.file = 'Filen må være PDF eller Word (.docx).';
      return errors;
    },
    uploadDocument() {
      const form = this.newDocument;
      form.submitted = true;
      if (Object.keys(this.documentErrors(form)).length) { this.focusFirstInvalidField(); return; }
      this.db.documents.push({ id: nextId(this.db.documents), created_at: timestampNow(), created_by: this.app.currentMemberId, title: form.title.trim(), file: form.new_file });
      this.notify(`«${form.title.trim()}» er lastet opp og ligger øverst i dokumentarkivet.`);
      this.newDocument = this.emptyDocument();
    },
    editDocument(document, event) {
      this.editedDocument = { ...document, new_file: '', submitted: false };
      this.openDrawer('Rediger dokument', document.title, event);
    },
    saveDocument() {
      const form = this.editedDocument;
      form.submitted = true;
      if (Object.keys(this.documentErrors(form)).length) { this.focusFirstInvalidField(); return; }
      const document = this.db.documents.find(row => row.id === form.id);
      Object.assign(document, { title: form.title.trim(), file: form.new_file || document.file });
      this.closeDrawer();
      this.notify(`«${document.title}» er lagret.`);
    },
    deleteDocument(document) {
      this.db.documents.splice(this.db.documents.indexOf(document), 1);
      this.confirmingDeleteId = null;
      this.notify(`«${document.title}» er slettet.`);
    },
  });
}

/* ==================== Admin: Resolusjonar (admin/resolusjonar) ==================== */

function adminResolutionsPage() {
  return withAdminTools({
    newResolution: null,
    editedResolution: null,
    init() {
      this.newResolution = this.emptyResolution();
      this.editedResolution = this.emptyResolution();
    },
    emptyResolution() {
      const today = this.app.today;
      return { id: null, year: today.getFullYear(), term: today.getMonth() >= 6 ? 'autumn' : 'spring', text: '', wiki_url: '', submitted: false };
    },
    get semesterGroups() {
      const groups = [];
      [...this.db.resolutions]
        .filter(resolution => this.matchesSearch(resolution.text))
        .sort((a, b) => b.year - a.year || (b.term === 'autumn') - (a.term === 'autumn') || a.created_at.localeCompare(b.created_at))
        .forEach(resolution => {
          const key = resolution.year + resolution.term;
          let group = groups.find(entry => entry.key === key);
          if (!group) groups.push(group = { key, label: format.semesterLong(resolution.year, resolution.term), resolutions: [] });
          group.resolutions.push(resolution);
        });
      return groups;
    },
    resolutionErrors(form) {
      const errors = {};
      if (!form) return errors;
      if (!(Number(form.year) >= 1990 && Number(form.year) <= 2035)) errors.year = 'Skriv inn et gyldig år.';
      if (!form.text.trim()) errors.text = 'Skriv inn selve resolusjonen.';
      if (!form.wiki_url.trim()) errors.wiki_url = 'Lenken til RidderWiki er påkrevd.';
      else if (!/^(\/|https?:\/\/)/.test(form.wiki_url.trim())) errors.wiki_url = 'Lenken må starte med / eller https://.';
      return errors;
    },
    fieldsFromForm(form) { return { year: Number(form.year), term: form.term, text: form.text.trim(), wiki_url: form.wiki_url.trim() } },
    addResolution() {
      const form = this.newResolution;
      form.submitted = true;
      if (Object.keys(this.resolutionErrors(form)).length) { this.focusFirstInvalidField(); return; }
      this.db.resolutions.push({ id: nextId(this.db.resolutions), created_at: timestampNow(), created_by: this.app.currentMemberId, ...this.fieldsFromForm(form) });
      this.notify(`Resolusjonen er lagt til under ${format.semesterLong(form.year, form.term)}.`);
      this.newResolution = this.emptyResolution();
    },
    editResolution(resolution, event) {
      this.editedResolution = { ...resolution, submitted: false };
      this.openDrawer('Rediger resolusjon', format.semesterLong(resolution.year, resolution.term), event);
    },
    saveResolution() {
      const form = this.editedResolution;
      form.submitted = true;
      if (Object.keys(this.resolutionErrors(form)).length) { this.focusFirstInvalidField(); return; }
      Object.assign(this.db.resolutions.find(row => row.id === form.id), this.fieldsFromForm(form));
      this.closeDrawer();
      this.notify('Resolusjonen er lagret.');
    },
    deleteResolution(resolution) {
      this.db.resolutions.splice(this.db.resolutions.indexOf(resolution), 1);
      this.confirmingDeleteId = null;
      this.notify('Resolusjonen er slettet.');
    },
  });
}

/* ==================== Admin: Bakgrunnsbilete (admin/bakgrunnsbilete) ==================== */

function adminBackgroundsPage() {
  return withAdminTools({
    pickedFile: null,
    pickedFileName: '',
    uploadSubmitted: false,
    previews: {},
    appBackground: '',
    attendanceBackground: '',
    init() {
      this.appBackground = this.app.setting('app_background') || '';
      this.attendanceBackground = this.app.setting('attendance_background') || '';
    },
    get activeCount() { return this.db.login_backgrounds.filter(background => background.is_active).length },
    pickFile(event) {
      const file = event.target.files[0];
      if (!file) return;
      this.pickedFile = file;
      this.pickedFileName = file.name;
    },
    uploadBackground() {
      this.uploadSubmitted = true;
      if (!this.pickedFileName) { this.focusFirstInvalidField(); return; }
      const id = nextId(this.db.login_backgrounds);
      this.db.login_backgrounds.push({ id, created_at: timestampNow(), created_by: this.app.currentMemberId, file: this.pickedFileName, is_active: true });
      if (this.pickedFile && this.pickedFile.type.startsWith('image/')) this.previews[id] = URL.createObjectURL(this.pickedFile);
      this.notify(`${this.pickedFileName} er lastet opp og er med i utvalget.`);
      this.pickedFile = null; this.pickedFileName = ''; this.uploadSubmitted = false;
    },
    toggleActive(background) {
      background.is_active = !background.is_active;
      this.notify(background.is_active ? `${background.file} er med i utvalget.` : `${background.file} er tatt ut av utvalget.`);
    },
    deleteBackground(background) {
      this.db.login_backgrounds.splice(this.db.login_backgrounds.indexOf(background), 1);
      if (this.appBackground === background.file) this.appBackground = '';
      if (this.attendanceBackground === background.file) this.attendanceBackground = '';
      this.confirmingDeleteId = null;
      this.notify(`${background.file} er slettet.`);
    },
    saveSetting(key, value) {
      let row = this.db.settings.find(setting => setting.key === key);
      if (!row) this.db.settings.push(row = { id: nextId(this.db.settings), created_at: timestampNow(), created_by: this.app.currentMemberId, key, value: null });
      row.value = value || null;
      row.updated_by = this.app.currentMemberId;
    },
    saveFixedBackgrounds() {
      this.saveSetting('app_background', this.appBackground);
      this.saveSetting('attendance_background', this.attendanceBackground);
      this.notify('De faste bakgrunnene er lagret.');
    },
  });
}
