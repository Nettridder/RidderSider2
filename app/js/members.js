/* Members: member lists, profiles, board, achievements, attendance, and the Medlemmer / Profil / Admin member pages. */

/* ==================== Medlemmer (medlemmer/medlemmer) ==================== */

function membersPage() {
  const RANK_ORDER = ['aspirant', 'knekt', 'ridder', 'ridder_1st_class', 'kommandorridder', 'storridder'];
  return {
    group: 'active',
    view: 'list',
    search: '',
    get app() { return this.$store.app },
    get members() {
      const query = this.search.trim().toLowerCase();
      const group = this.group === 'active' ? this.app.activeMembers : this.app.formerMembers;
      return group
        .filter(member => !query || this.app.memberName(member).toLowerCase().includes(query))
        .sort((a, b) => {
          const rankA = RANK_ORDER.indexOf(a.rank);
          const rankB = RANK_ORDER.indexOf(b.rank);
          if (rankA !== rankB) return rankB - rankA;
          const startA = new Date(a.joined_year, a.joined_term === 'spring' ? 1 : 8);
          const startB = new Date(b.joined_year, b.joined_term === 'spring' ? 1 : 8);
          return startA - startB;
        });
    },
    memberPeriod: format.memberPeriod,
    profileHref(member) { return pageHref('profil/profil') + '?id=' + member.id },
  };
}

/* ==================== Styret (medlemmer/styret) ==================== */

function boardPage() {
  return {
    view: 'gallery',
    get app() { return this.$store.app },
    semesterName(board) { return board ? format.semesterLong(board.year, board.term) : '' },
    get boardPositions() {
      return LABELS.boardPositions.map(position => ({
        key: position.key,
        title: position.label,
      }));
    },
    seats(board) {
      if (!board) return [];
      return LABELS.boardPositions.map(position => {
        const number = board[position.key + '_number'];
        return {
          key: position.key,
          title: position.label + (number ? ' nr. ' + number : ''),
          member: this.app.member(board[position.key + '_id']),
        };
      });
    },
    boardPositionMember(board, position) {
      if (!board) return null;
      return this.app.member(board[position.key + '_id']);
    },
    profileHref(member) { return pageHref('profil/profil') + '?id=' + member.id },
  };
}

/* ==================== Profil (profil/profil) ==================== */

function profilePage() {
  const requestedId = Number(new URLSearchParams(location.search).get('id'));
  return {
    contactMessage: '',
    get app() { return this.$store.app },
    get member() { return this.app.member(requestedId || this.app.currentMemberId) },
    get isOwnProfile() { return this.member && this.member.id === this.app.currentMemberId },
    get membershipPeriod() {
      const member = this.member;
      const joined = format.semester(member.joined_year, member.joined_term);
      return member.status === 'former'
        ? `${joined}–${format.semester(member.left_year, member.left_term)}`
        : `Medlem siden ${format.semesterLong(member.joined_year, member.joined_term).toLowerCase()}`;
    },
    get boardPositions() {
      const positions = [];
      this.app.boardsNewestFirst.forEach(board => {
        LABELS.boardPositions.forEach(position => {
          if (board[position.key + '_id'] !== this.member.id) return;
          const number = board[position.key + '_number'];
          positions.push({ key: board.id + position.key, title: position.label + (number ? ' nr. ' + number : ''), semester: format.semesterLong(board.year, board.term) });
        });
      });
      return positions;
    },
    get recentPractice() {
      return this.app.practiceLogs(this.member.id).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 5);
    },
    get earnedAchievements() { return this.app.achievementsFor(this.member.id).filter(achievement => achievement.earnedAt) },
    get contactSubject() { return `App: feil med bruker ${this.member.first_name} ${this.member.last_name}`; },
    sendEmailToNettridder() {
      const subject = this.contactSubject;
      const body = this.contactMessage;
      if (!body.trim()) return;
      const mailto = `mailto:nettridder@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
      this.contactMessage = '';
      this.$store.ui.notify('Email klar for sending.');
    },
  };
}

/* ==================== Achievements (profil/achievements) ==================== */

function achievementsPage() {
  return {
    get achievements() { return this.$store.app.achievementsFor() },
    get earnedCount() { return this.achievements.filter(achievement => achievement.earnedAt).length },
  };
}

/* ==================== Innstillinger (profil/innstillinger) ==================== */

function settingsPage() {
  return {
    emailLevel: 'all',
    get app() { return this.$store.app },
    init() { this.emailLevel = this.app.me.email_level },
    save() {
      this.app.me.email_level = this.emailLevel;
      this.$store.ui.notify(this.emailLevel === 'all' ? 'Lagret. Du får e-postvarsel om opptellinger og påminnelser.' : 'Lagret. Du får bare viktige meldinger på e-post.');
    },
    resetPassword() {
      this.$store.ui.notify(`Vi har sendt en lenke til ${this.app.me.email}.`, 'Demo: ingen e-post blir sendt.');
    },
  };
}

/* ==================== Admin: Medlemmer (admin/medlemmer) ==================== */

const MEMBER_FIELDS = ['first_name', 'last_name', 'email', 'phone', 'voice_group', 'rank', 'status', 'joined_term', 'joined_year', 'left_term', 'left_year', 'roles'];


function adminMembersPage() {
  return withAdminTools({
    statusFilter: 'active',
    newMember: null,
    editedMember: null,
    init() {
      this.newMember = this.emptyMember();
      this.editedMember = this.emptyMember();
    },
    get listedMembers() {
      return this.db.members
        .filter(member => this.statusFilter === 'all' || member.status === this.statusFilter)
        .filter(member => this.matchesSearch(this.app.memberName(member), member.email))
        .sort((a, b) => this.app.memberName(a).localeCompare(this.app.memberName(b), 'nb'));
    },
    memberSummary(member) {
      const roles = member.roles.map(role => LABELS.roles[role]);
      return [LABELS.voices[member.voice_group], LABELS.ranks[member.rank], member.status === 'former' ? 'ypp.com.' : '', ...roles].filter(Boolean).join(', ');
    },
    emptyMember() {
      return {
        id: null, first_name: '', last_name: '', email: '', phone: '', voice_group: 'T1', rank: 'aspirant', status: 'active',
        joined_term: 'autumn', joined_year: this.app.today.getFullYear(), left_term: '', left_year: '', roles: [],
        image_file: '', new_image_name: '', submitted: false,
      };
    },
    memberErrors(form) {
      const errors = {};
      if (!form) return errors;
      const validYear = year => Number(year) >= 1950 && Number(year) <= 2030;
      if (!form.first_name.trim()) errors.first_name = 'Skriv inn fornavn.';
      if (!form.last_name.trim()) errors.last_name = 'Skriv inn etternavn.';
      const email = form.email.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Skriv inn en gyldig e-postadresse.';
      else if (this.db.members.some(member => member.id !== form.id && member.email.toLowerCase() === email)) errors.email = 'Et annet medlem bruker allerede denne e-postadressen.';
      if (!validYear(form.joined_year)) errors.joined_year = 'Skriv inn året medlemmet begynte.';
      if (form.status === 'former' && (!form.left_term || !validYear(form.left_year))) errors.left = 'Velg semester og år medlemmet sluttet. Det må med når status er ypp.com.';
      const masters = this.db.members.filter(member => member.roles.includes('master'));
      if (form.id && !form.roles.includes('master') && masters.length === 1 && masters[0].id === form.id) errors.roles = 'Dette er den siste med rollen Mester. Gi rollen til noen andre først.';
      return errors;
    },
    hasErrors(form) { return Object.keys(this.memberErrors(form)).length > 0 },
    fieldsFromForm(form) {
      const fields = {};
      MEMBER_FIELDS.forEach(key => { fields[key] = Array.isArray(form[key]) ? [...form[key]] : form[key]; });
      fields.first_name = form.first_name.trim();
      fields.last_name = form.last_name.trim();
      fields.email = form.email.trim().toLowerCase();
      fields.phone = form.phone.trim() || null;
      fields.joined_year = Number(form.joined_year);
      fields.left_term = form.status === 'former' ? form.left_term : null;
      fields.left_year = form.status === 'former' ? Number(form.left_year) : null;
      return fields;
    },
    addMember() {
      const form = this.newMember;
      form.submitted = true;
      if (this.hasErrors(form)) { this.focusFirstInvalidField(); return; }
      const member = {
        id: nextId(this.db.members), created_at: timestampNow(), created_by: this.app.currentMemberId, last_login: null,
        ...this.fieldsFromForm(form), email_level: 'all', image_file: 'portrett.png',
      };
      this.db.members.push(member);
      this.newMember = this.emptyMember();
      this.notify(`${this.app.memberName(member)} er lagt til. Invitasjonen er sendt til ${member.email}.`);
    },
    editMember(member, event) {
      this.editedMember = { ...member, roles: [...member.roles], phone: member.phone || '', left_term: member.left_term || '', left_year: member.left_year || '', new_image_name: '', submitted: false };
      this.openDrawer('Rediger medlem', this.app.memberName(member), event);
    },
    saveMember() {
      const form = this.editedMember;
      form.submitted = true;
      if (this.hasErrors(form)) { this.focusFirstInvalidField(); return; }
      const member = this.app.member(form.id);
      const fields = this.fieldsFromForm(form);
      Object.assign(member, fields);
      this.closeDrawer();
      this.notify(`Endringene for ${this.app.memberName(member)} er lagret.`);
    },
    sendNewInvitation() {
      this.notify(`Ny invitasjon er sendt til ${this.editedMember.email}.`);
    },
    deleteBlockedReason(form) {
      if (!form || !form.id) return '';
      if (form.id === this.app.currentMemberId) return 'Du kan ikke fjerne deg selv.';
      const masters = this.db.members.filter(member => member.roles.includes('master'));
      if (masters.length === 1 && masters[0].id === form.id) return 'Den siste med rollen Mester kan ikke fjernes.';
      return '';
    },
    deleteMember() {
      const member = this.app.member(this.editedMember.id);
      this.db.members.splice(this.db.members.indexOf(member), 1);
      this.closeDrawer(false);
      this.notify(`${this.app.memberName(member)} er fjernet fra medlemslista.`);
      this.$nextTick(() => document.querySelector('main h1').focus());
    },
  });
}

/* ==================== Admin: Styret (admin/styret) ==================== */

const semesterOrder = (year, term) => Number(year) * 2 + (term === 'autumn' ? 1 : 0);


function adminBoardPage() {
  return withAdminTools({
    newBoard: null,
    editedBoard: null,
    init() {
      this.newBoard = this.boardFormForNextSemester();
      this.editedBoard = this.boardFormFrom(this.app.currentBoard || {});
    },
    memberOptions(selectedId) {
      return this.db.members
        .filter(member => member.status === 'active' || member.id === selectedId)
        .sort((a, b) => this.app.memberName(a).localeCompare(this.app.memberName(b), 'nb'));
    },
    boardFormFrom(board) {
      const positions = {};
      LABELS.boardPositions.forEach(({ key }) => {
        positions[key] = { member_id: board[key + '_id'] || '', number: board[key + '_number'] || '' };
      });
      return { id: board.id || null, year: board.year || this.app.today.getFullYear(), term: board.term || 'autumn', positions, submitted: false };
    },
    boardFormForNextSemester() {
      const current = this.app.currentBoard;
      const form = this.boardFormFrom(current || {});
      form.id = null;
      if (current) {
        form.year = current.term === 'autumn' ? current.year + 1 : current.year;
        form.term = current.term === 'autumn' ? 'spring' : 'autumn';
      }
      return form;
    },
    previousBoard(form) {
      const order = semesterOrder(form.year, form.term);
      return this.app.boardsNewestFirst.find(board => board.id !== form.id && semesterOrder(board.year, board.term) < order);
    },
    renumber(form, key) {
      const position = form.positions[key];
      if (!position.member_id) { position.number = ''; return; }
      const previous = this.previousBoard(form);
      if (!previous || !previous[key + '_number']) { position.number = position.number || 1; return; }
      position.number = previous[key + '_id'] === position.member_id ? previous[key + '_number'] : previous[key + '_number'] + 1;
    },
    renumberAll(form) { LABELS.boardPositions.forEach(({ key }) => this.renumber(form, key)); },
    boardErrors(form) {
      const errors = {};
      if (!form) return errors;
      if (!(Number(form.year) >= 1990 && Number(form.year) <= 2035)) errors.semester = 'Skriv inn et gyldig år.';
      else if (this.db.boards.some(board => board.id !== form.id && board.year === Number(form.year) && board.term === form.term)) errors.semester = `Det finnes allerede et styre for ${format.semesterLong(form.year, form.term)}. Rediger det i lista under.`;
      return errors;
    },
    columnsFromForm(form) {
      const columns = { year: Number(form.year), term: form.term };
      LABELS.boardPositions.forEach(({ key }) => {
        const position = form.positions[key];
        columns[key + '_id'] = position.member_id || null;
        columns[key + '_number'] = position.member_id ? Number(position.number) || null : null;
      });
      return columns;
    },
    addBoard() {
      const form = this.newBoard;
      form.submitted = true;
      if (Object.keys(this.boardErrors(form)).length) { this.focusFirstInvalidField(); return; }
      this.db.boards.push({ id: nextId(this.db.boards), created_at: timestampNow(), created_by: this.app.currentMemberId, ...this.columnsFromForm(form) });
      this.notify(`Styret for ${format.semesterLong(form.year, form.term)} er lagret.`);
      this.newBoard = this.boardFormForNextSemester();
    },
    editBoard(board, event) {
      this.editedBoard = this.boardFormFrom(board);
      this.openDrawer('Rediger styret', format.semesterLong(board.year, board.term), event);
    },
    saveBoard() {
      const form = this.editedBoard;
      form.submitted = true;
      if (Object.keys(this.boardErrors(form)).length) { this.focusFirstInvalidField(); return; }
      Object.assign(this.db.boards.find(board => board.id === form.id), this.columnsFromForm(form));
      this.closeDrawer();
      this.notify(`Styret for ${format.semesterLong(form.year, form.term)} er oppdatert.`);
    },
    deleteBoard(board) {
      this.db.boards.splice(this.db.boards.indexOf(board), 1);
      this.confirmingDeleteId = null;
      this.notify(`Styret for ${format.semesterLong(board.year, board.term)} er slettet.`);
    },
  });
}

/* ==================== Admin: Opptellinger (admin/opptellinger) ==================== */

function latestThursdayOnOrBefore(date) {
  return addDays(date, -((date.getDay() - 4 + 7) % 7));
}

function adminAttendancePage() {
  return withAdminTools({
    rehearsalDate: '',
    presentIds: [],
    init() { this.loadDate(format.dateKey(latestThursdayOnOrBefore(this.app.today))); },
    get existingRow() { return this.db.attendance.find(row => row.rehearsal_date === this.rehearsalDate) },
    get historyRows() { return [...this.db.attendance].sort((a, b) => b.rehearsal_date.localeCompare(a.rehearsal_date)) },
    membersIn(voice) {
      return this.app.activeMembers.filter(member => member.voice_group === voice)
        .sort((a, b) => this.app.memberName(a).localeCompare(this.app.memberName(b), 'nb'));
    },
    presentCount(row) { return row.present_member_ids.filter(id => this.app.member(id)).length },
    loadDate(dateKey) {
      if (!dateKey) return;
      this.rehearsalDate = dateKey;
      const row = this.existingRow;
      this.presentIds = row ? [...row.present_member_ids] : [];
    },
    openRow(row) {
      this.loadDate(row.rehearsal_date);
      this.$refs.attendanceForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.$nextTick(() => document.getElementById('rehearsal-date').focus({ preventScroll: true }));
    },
    submitAttendance() {
      const presentIds = [...this.presentIds].sort((a, b) => a - b);
      const dateLabel = format.fullDate(format.parseDate(this.rehearsalDate));
      const row = this.existingRow;
      if (row) {
        Object.assign(row, { present_member_ids: presentIds, updated_by: this.app.currentMemberId, updated_at: timestampNow() });
        this.notify(`Opptellingen for ${dateLabel} er oppdatert: ${presentIds.length} til stede.`);
      } else {
        this.db.attendance.push({ id: nextId(this.db.attendance), created_at: timestampNow(), created_by: this.app.currentMemberId, updated_by: null, rehearsal_date: this.rehearsalDate, present_member_ids: presentIds });
        this.notify(`Opptellingen for ${dateLabel} er sendt inn: ${presentIds.length} til stede.`);
      }
    },
  });
}

/* ==================== Admin: Achievements (admin/achievements) ==================== */

const TRIGGER_LABELS = {
  practice_logged: 'Registrert øving',
  song_knowledge_updated: 'Endret sangkunnskap',
  attendance_saved: 'Lagret opptelling',
};


function adminAchievementsPage() {
  return withAdminTools({
    editedAchievement: { id: null, title: '', description: '', image: '', new_image: '', key: '', is_secret: false, submitted: false },
    grantMemberId: '',
    get sortedAchievements() { return [...this.db.achievements].sort((a, b) => a.sort_order - b.sort_order) },
    triggerLabel(trigger) { return TRIGGER_LABELS[trigger] || trigger },
    earnedCount(achievement) { return this.db.member_achievements.filter(row => row.achievement_id === achievement.id).length },
    get holders() {
      return this.db.member_achievements
        .filter(row => row.achievement_id === this.editedAchievement.id)
        .map(row => ({ row, member: this.app.member(row.member_id) }))
        .filter(holder => holder.member)
        .sort((a, b) => b.row.created_at.localeCompare(a.row.created_at));
    },
    get membersWithout() {
      const holderIds = this.holders.map(holder => holder.member.id);
      return this.db.members.filter(member => !holderIds.includes(member.id))
        .sort((a, b) => (a.status === 'active' ? 0 : 1) - (b.status === 'active' ? 0 : 1) || this.app.memberName(a).localeCompare(this.app.memberName(b), 'nb'));
    },
    editAchievement(achievement, event) {
      this.editedAchievement = { ...achievement, new_image: '', submitted: false };
      this.grantMemberId = '';
      this.openDrawer('Rediger achievement', achievement.title, event);
    },
    saveAchievement() {
      const form = this.editedAchievement;
      form.submitted = true;
      if (!form.title.trim() || !form.description.trim()) { this.focusFirstInvalidField(); return; }
      const achievement = this.db.achievements.find(row => row.id === form.id);
      Object.assign(achievement, { title: form.title.trim(), description: form.description.trim(), is_secret: form.is_secret, image: form.new_image || achievement.image });
      this.closeDrawer();
      this.notify(`«${achievement.title}» er lagret.`);
    },
    grant() {
      const member = this.app.member(this.grantMemberId);
      if (!member) return;
      this.db.member_achievements.push({ id: nextId(this.db.member_achievements), created_at: timestampNow(), created_by: this.app.currentMemberId, member_id: member.id, achievement_id: this.editedAchievement.id });
      this.grantMemberId = '';
      this.notify(`${this.app.memberName(member)} har fått «${this.editedAchievement.title}».`);
    },
    revoke(holder) {
      this.db.member_achievements.splice(this.db.member_achievements.indexOf(holder.row), 1);
      this.notify(`«${this.editedAchievement.title}» er fjernet fra ${this.app.memberName(holder.member)}.`);
    },
  });
}
