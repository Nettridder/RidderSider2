/* =====================================================================
   data.js — demo data and shared state for every page.
   - RD      : fixed data + small helpers (names, dates, numbers)
   - $store.app : state that pages change (demo status/roles, songs,
                  repertoires, members, practice log). Saved in
                  localStorage so it carries over between pages.
   Load order on every page: data.js, meny.js, then page scripts.
   ===================================================================== */
(function(){
  const PAGE = document.body.dataset.page || 'hjem';
  const ROOT = '../'.repeat(PAGE==='hjem' ? 0 : PAGE.split('/').length - 1);
  window.PAGE = PAGE;
  window.ROOT = ROOT;

  // Demo "today": Friday 25 September 2026.
  const TODAY = new Date(2026, 8, 25);
  const VOICES = {T1:'1. tenor', T2:'2. tenor', T3:'3. tenor', B1:'1. bass', B2:'2. bass', Tutti:'Tutti', Alle:'Alle'};
  const RANKS = [
    {k:'aspirant',t:'Aspirant'},{k:'knekt',t:'Knekt'},{k:'ridder',t:'Ridder'},
    {k:'ridder_1st_class',t:'Ridder av 1. klasse'},{k:'kommandorridder',t:'Kommandørridder'},{k:'storridder',t:'Storridder'},
  ];
  const MONTHS = ['januar','februar','mars','april','mai','juni','juli','august','september','oktober','november','desember'];
  const MON_S = ['jan','feb','mar','apr','mai','jun','jul','aug','sep','okt','nov','des'];
  const DAYS = ['søndag','mandag','tirsdag','onsdag','torsdag','fredag','lørdag'];
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const iso = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  const slug = s => s.toLowerCase().replace(/æ/g,'ae').replace(/ø/g,'o').replace(/å/g,'a').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const clone = x => JSON.parse(JSON.stringify(x));

  /* ---------- songs: id, name, genres, starting notes, knowledge, secret ---------- */
  const SONGS = [
    [0,'Stille Natt',['Julesang'],'T1 B♭3, T2 F3, B1 D3, B2 B♭2','kjent'],
    [1,'Deilig er jorden',['Salme','Julesang'],'T1 D4, T2 A3, B1 F♯3, B2 D3','kjent'],
    [2,'Glade jul',['Julesang'],'T1 E4, T2 C4, B1 G3, B2 C3','litt'],
    [3,'Jeg er så glad hver julekveld',['Julesang'],'T1 C4, B2 F2','ikke'],
    [4,'O helga natt',['Julesang'],'T1 E♭4, T2 C4, T3 A♭3, B1 E♭3, B2 A♭2','litt'],
    [5,'Nidelven',['Vise'],'T1 E♭4, T2 B♭3, B2 E♭3','kjent'],
    [6,'Kjerringa med staven',['Folketone'],'Alle G3','kjent'],
    [7,'Vårsøg',['Romanse'],'T1 A♭3, T2 E♭3, B1 C3, B2 A♭2','ikke'],
    [8,'Bergensiana',['Byvise'],'T1 A3, B2 D3','kjent'],
    [9,'Sønner av Norge',['Fedrelandssang'],'T1 E4, T2 B3, B1 G♯3, B2 E3','ikke'],
    [10,'Mitt hjerte alltid vanker',['Salme','Julesang'],'T1 E♭4, T2 B♭3, B1 G3','kjent'],
    [11,'Det kimer nå til julefest',['Julesang'],'T1 F4, T2 C4, B1 A3, B2 F3','kjent'],
    [12,'Et barn er født i Betlehem',['Salme'],'Alle G3','kjent'],
    [13,'Nordnorsk julesalme',['Julesang','Salme'],'T1 A3, T2 E3, B1 C♯3, B2 A2','kjent'],
    [14,'Vi ere en nasjon, vi med',['Fedrelandssang'],'T1 D4, T2 B♭3, B1 F3, B2 B♭2','litt'],
    [15,'Ja, vi elsker',['Fedrelandssang'],'T1 F4, T2 C4, B1 A3, B2 F3','kjent'],
    [16,'Helan går',['Drikkevise'],'Alle C4','kjent'],
    [17,'Riddersangen',['Drikkevise','Vise'],'T1 G4, T2 D4, B1 B3, B2 G3','litt'],
    [18,'Bestillingsverk 2027',['Romanse'],'T1 E4, T2 C4, T3 A3, B1 E3, B2 A2','ikke', true],
    [19,'Bursdagssang for dirigenten',['Vise'],'Alle D4','ikke', true],
  ].map(([id,t,g,p,k,secret]) => {
    const pitch = p.split(', ').map(x => { const [v,n] = x.split(' '); return {v, n}; });
    const files = [{name:'Noter', voice:'Tutti', type:'sheet', file:slug(t)+'.pdf'}];
    pitch.forEach(q => files.push(q.v==='Alle'
      ? {name:'Tutti', voice:'Tutti', type:'audio', file:slug(t)+'-tutti.mp3'}
      : {name:VOICES[q.v], voice:q.v, type:'audio', file:slug(t)+'-'+q.v.toLowerCase()+'.mp3'}));
    files.push({name:'Toneangiver', voice:'Tutti', type:'pitch', file:slug(t)+'-toner.mp3'});
    return {id, t, g, pitch, k, secret:!!secret, lyrics:'', choreo: id===17 ? 'https://youtube.com/watch?v=riddersang' : '', files};
  });

  const REPS = [
    {id:1, name:'Julekonsert 2026', visible:true, note:'Johanneskirken, lør 12. des 19:00. Sangene i konsertrekkefølge.', songs:[11,1,10,2,12,7,5,8,6,9,13,3,4,0]},
    {id:2, name:'Faste sanger', visible:true, note:'Sangene vi alltid skal kunne synge.', songs:[17,15,16,5,8,6,9]},
    {id:3, name:'Vårkonsert 2027', visible:false, note:'Utkast. Bare synlig for noteansvarlige.', songs:[18,7,14,10]},
  ];

  const MEMBERS = [
    {id:1, fn:'Ola', ln:'Nordmann', email:'ola.nordmann@example.no', phone:'+4791234567', voice:'T2', rank:'ridder', status:'active', roles:[], jt:'H', jy:2019, lt:'', ly:''},
    {id:2, fn:'Per', ln:'Hansen', email:'per.hansen@example.no', phone:'+4792345678', voice:'T1', rank:'kommandorridder', status:'active', roles:[], jt:'V', jy:2011, lt:'', ly:''},
    {id:3, fn:'Knut', ln:'Berg', email:'knut.berg@example.no', phone:'', voice:'B2', rank:'storridder', status:'active', roles:[], jt:'H', jy:2004, lt:'', ly:''},
    {id:4, fn:'Lars', ln:'Berg', email:'lars.berg@example.no', phone:'+4793456789', voice:'B1', rank:'ridder_1st_class', status:'active', roles:['notes'], jt:'V', jy:2016, lt:'', ly:''},
    {id:5, fn:'Jon', ln:'Dahl', email:'jon.dahl@example.no', phone:'', voice:'T2', rank:'knekt', status:'active', roles:[], jt:'H', jy:2022, lt:'', ly:''},
    {id:6, fn:'Erik', ln:'Moe', email:'erik.moe@example.no', phone:'+4794567890', voice:'B2', rank:'storridder', status:'active', roles:['master'], jt:'H', jy:2008, lt:'', ly:''},
    {id:7, fn:'Anders', ln:'Lie', email:'anders.lie@example.no', phone:'', voice:'T1', rank:'aspirant', status:'active', roles:[], jt:'V', jy:2024, lt:'', ly:''},
    {id:8, fn:'Sindre', ln:'Aas', email:'sindre.aas@example.no', phone:'', voice:'B1', rank:'ridder', status:'former', roles:[], jt:'H', jy:2013, lt:'V', ly:2023},
  ];

  /* ---------- calendar (from Google Calendar in the real app): date, time, title, where, public ---------- */
  const EVENTS = [
    ['2026-09-17','19:00','Øving','',0],
    ['2026-09-18','18:00','Styremøte','Øvingslokalet',0],
    ['2026-09-24','19:00','Øving','',0],
    ['2026-10-01','19:00','Øving','Julekonsert-innspurt',0],
    ['2026-10-03','14:00','Opptreden','Grieghallen foyer',1],
    ['2026-10-08','19:00','Øving','Stemmeøving, tenorer først',0],
    ['2026-10-15','19:00','Øving','Gjennomkjøring av programmet',0],
    ['2026-10-16','','Semesterfest','',0],
    ['2026-10-22','17:30','Styremøte','Øvingslokalet',0],
    ['2026-10-22','19:00','Øving','',0],
    ['2026-10-29','19:00','Øving','',0],
    ['2026-11-05','19:00','Øving','',0],
    ['2026-11-07','18:00','Høstkonsert','Universitetsaulaen',1],
    ['2026-11-12','19:00','Øving','',0],
    ['2026-11-19','19:00','Øving','',0],
    ['2026-11-26','19:00','Øving','',0],
    ['2026-12-03','19:00','Øving','',0],
    ['2026-12-10','19:00','Øving','',0],
    ['2026-12-11','18:00','Generalprøve','Johanneskirken',0],
    ['2026-12-12','19:00','Julekonsert','Johanneskirken',1],
    ['2026-12-17','19:00','Juleavslutning','',0],
  ].map(([d,t,w,where,pub],i) => { const [y,m,dd] = d.split('-').map(Number); return {id:'e'+i, iso:d, date:new Date(y,m-1,dd), t, w, where, pub:!!pub}; });

  window.RD = {
    TODAY, VOICES, RANKS, MONTHS, MON_S, DAYS, EVENTS,
    GENRES:['Julesang','Salme','Vise','Folketone','Romanse','Byvise','Fedrelandssang','Drikkevise'],
    KNOW:[{v:'kjent',t:'Kjent'},{v:'litt',t:'Litt kjent'},{v:'ikke',t:'Ikke kjent'}],
    PLAN:[
      {d:'Torsdag 1. okt, 19:00', w:'Julekonsert-innspurt', s:'Deilig er jorden, Glade jul, O helga natt'},
      {d:'Torsdag 8. okt, 19:00', w:'Stemmeøving, tenorer først', s:'Vårsøg, Sønner av Norge'},
      {d:'Torsdag 15. okt, 19:00', w:'Gjennomkjøring av programmet', s:'Hele julekonserten'},
    ],
    BOARD:[{r:'Leder', n:'Erik Moe'},{r:'Nestleder', n:'Per Hansen'},{r:'Kasserer', n:'Lars Berg'},{r:'Sekretær', n:'Anders Lie'}],
    DOCS:[{t:'Sangerhåndbok', d:'Aug 2026'},{t:'Referat fra årsmøtet', d:'Feb 2026'},{t:'Vedtekter', d:'Mars 2024'}],
    SNART:{
      aktiv:{
        lead:{kind:'Neste øving', day:'Torsdag 1. okt', time:'19:00', title:'«Julekonsert-innspurt»'},
        later:[
          {id:'a1', d:'Lør 3. okt', w:'Opptreden', where:'Grieghallen foyer', t:'14:00'},
          {id:'a2', d:'Tor 8. okt', w:'Øving', t:'19:00'},
          {id:'a3', d:'Fre 16. okt', w:'Semesterfest', t:''},
        ]},
      tidligere:{
        lead:{kind:'Neste opptreden', day:'Lørdag 3. okt', time:'14:00', title:'Grieghallen foyer'},
        later:[
          {id:'t1', d:'Lør 7. nov', w:'Høstkonsert', where:'Universitetsaulaen', t:'18:00'},
          {id:'t2', d:'Lør 12. des', w:'Julekonsert', where:'Johanneskirken', t:'19:00'},
        ]},
    },
    img:{logo: ROOT + '../../logo.png', portrait: ROOT + '../../portrett.png'},
    voiceName: v => VOICES[v] || v,
    rankName: k => (RANKS.find(r => r.k===k) || {}).t || k,
    roleName: r => r==='master' ? 'Mester' : r==='notes' ? 'Note' : r,
    knowLabel: k => ({kjent:'Kjent', litt:'Litt kjent', ikke:'Ikke kjent'})[k],
    fmt: n => n.toLocaleString('nb-NO'),
    cap, iso, clone,
    shortDate: d => cap(DAYS[d.getDay()].slice(0,3)) + ' ' + d.getDate() + '. ' + MON_S[d.getMonth()],
    longDate: d => cap(DAYS[d.getDay()]) + ' ' + d.getDate() + '. ' + MONTHS[d.getMonth()],
  };

  /* ---------- shared, saved state ---------- */
  const KEY = 'mar-demo-v1';
  const SAVED = ['status','roles','repCount','songs','reps','members','streak','week','total','logged','docRead'];
  const seed = () => ({
    status:'aktiv', roles:[], repCount:'3',
    songs:clone(SONGS), reps:clone(REPS), members:clone(MEMBERS),
    streak:6, week:45, total:1540, logged:false, docRead:false,
  });
  function load(){
    try{ const s = JSON.parse(localStorage.getItem(KEY)); return s && s.v===1 ? s.d : null; }catch(_){ return null; }
  }

  document.addEventListener('alpine:init', () => {
    const store = {
      goal:60,
      get isNoteAdmin(){ return this.roles.includes('notes') || this.roles.includes('master') },
      get isMaster(){ return this.roles.includes('master') },
      songById(id){ return this.songs.find(s => s.id===id) },
      // Secret songs are only shown when they sit in a visible repertoire.
      get visibleSongs(){
        const shown = new Set(this.reps.filter(r => r.visible).flatMap(r => r.songs));
        return this.songs.filter(s => !s.secret || shown.has(s.id));
      },
      // Drafts are visible to note admins, marked "Utkast".
      get visibleReps(){ return this.reps.filter(r => r.visible || this.isNoteAdmin) },
      setRepCount(n){ this.repCount = String(n); this.reps = clone(REPS.slice(0, +n)); },
      // Keep Ola's own member row in step with the demo control.
      syncMe(){
        const m = this.members.find(m => m.id===1); if(!m) return;
        m.roles = [...this.roles];
        m.status = this.status==='aktiv' ? 'active' : 'former';
        if(m.status==='former' && !m.lt){ m.lt='V'; m.ly=2026; }
      },
      reset(){ Object.assign(this, seed()); },
    };
    // getters stay getters: copy the plain data onto the object, not the other way round
    Object.assign(store, seed(), load() || {});
    Alpine.store('app', store);
    const st = Alpine.store('app');
    Alpine.effect(() => {
      const d = {}; SAVED.forEach(k => { d[k] = st[k]; });
      const json = JSON.stringify({v:1, d});
      try{ localStorage.setItem(KEY, json); }catch(_){}
    });
  });
})();
