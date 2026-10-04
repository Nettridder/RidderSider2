/* =====================================================================
   meny.js — the parts every page shares, written once:
   top bar + profile menu, main menu, sub-strip, access check,
   page title and the demo control.

   MENY below is the single source for the menus AND the folder layout:
     section key  = folder          (noter/)
     sub key      = file            (noter/sanger.html)
     admin subs   = admin/ folder   (noter/admin/sanger.html)
   A page only says where it is:  <body data-page="noter/sanger">
   ===================================================================== */
(function(){
  const MENY = [
    {k:'hjem', t:'Hjem'},
    {k:'noter', t:'Noter', subs:[
      {k:'sanger', t:'Sanger'},
      {k:'repertoar', t:'Repertoar', aktiv:true},
      {k:'ovingsplan', t:'Øvingsplan', aktiv:true},
      {k:'toneangiver', t:'Toneangiver'},
    ], admin:{t:'Note-admin', roller:['notes','master'], subs:[
      {k:'sanger', t:'Sanger'},
      {k:'repertoar', t:'Repertoar'},
      {k:'sangkunnskap', t:'Sangkunnskap'},
      {k:'ovingsplan', t:'Øvingsplan'},
      {k:'ovingskonkurranse', t:'Øvingskonkurranse'},
    ]}},
    {k:'medlemmer', t:'Medlemmer', subs:[
      {k:'medlemmer', t:'Medlemmer'},
      {k:'styret', t:'Styret'},
    ], admin:{t:'Admin', roller:['master'], subs:[
      {k:'medlemmer', t:'Medlemmer'},
      {k:'styret', t:'Styret'},
      {k:'opptellinger', t:'Opptellinger'},
      {k:'dokumenter', t:'Dokumenter'},
      {k:'resolusjonar', t:'Resolusjonar'},
      {k:'bakgrunnsbilete', t:'Bakgrunnsbilete'},
    ]}},
    {k:'ridderdata', t:'Ridderdata', subs:[
      {k:'kalender', t:'Kalender'},
      {k:'dokumenter', t:'Dokumenter'},
      {k:'wiki', t:'RidderWiki', ext:'/ridderwiki'},
      {k:'video', t:'Videoarkiv', ext:'/ridderwiki/Videoarkiv'},
      {k:'bilder', t:'Bildearkiv', ext:'https://armeriddere.smugmug.com'},
    ]},
    {k:'kontakt', t:'Kontakt', subs:[
      {k:'epostlister', t:'Epostlister'},
      {k:'forum', t:'Anonym Forum'},
    ]},
  ];
  const CHOIR = 'Mannskoret Arme Riddere';
  const PAGE = window.PAGE, ROOT = window.ROOT;
  const parts = PAGE.split('/');
  const SEC = parts[0], IS_ADM = parts[1]==='admin', SUB = IS_ADM ? parts[2] : parts[1];
  const sec = MENY.find(s => s.k===SEC) || MENY[0];
  const here = SEC==='hjem' ? {t:'Hjem'} : (IS_ADM ? sec.admin.subs : sec.subs).find(s => s.k===SUB) || {t:''};

  const href = (s, sub, adm) => s==='hjem' ? ROOT + 'index.html' : ROOT + s + '/' + (adm ? 'admin/' : '') + sub + '.html';
  const hasRole = (st, roller) => roller.some(r => st.roles.includes(r));

  /* Can the current demo user see a page? Used by the access check below. */
  window.kanSe = function(page){
    const st = Alpine.store('app');
    const [s, a, b] = page.split('/');
    const S = MENY.find(x => x.k===s); if(!S || s==='hjem') return true;
    if(a==='admin') return !!S.admin && hasRole(st, S.admin.roller);
    const sub = (S.subs || []).find(x => x.k===a);
    return !(sub && sub.aktiv && st.status!=='aktiv');
  };

  document.title = (IS_ADM ? sec.admin.t + ': ' : '') + here.t + ' – ' + CHOIR;

  /* Alpine component behind the shared chrome. */
  window.meny = function(){
    return {
      MENY, SEC, SUB, IS_ADM, ROOT, sec, img:RD.img,
      meOpen:false, demoOpen:false,
      href,
      subsFor(s){ const st = this.$store.app; return (s.subs || []).filter(x => !(x.aktiv && st.status!=='aktiv')); },
      firstHref(s){ const f = this.subsFor(s).find(x => !x.ext); return href(s.k, f ? f.k : '', false); },
      get subs(){ return this.subsFor(sec) },
      get showAdmin(){ return sec.admin && hasRole(this.$store.app, sec.admin.roller) },
      toggleMe(){ this.meOpen ? (this.meOpen=false) : this.openMe() },
      openMe(){ this.meOpen = true; this.$nextTick(() => this.$refs.meMenu.querySelector('a').focus()); },
      moveMenu(d){
        const items = [...this.$refs.meMenu.querySelectorAll('a')];
        const i = items.indexOf(document.activeElement);
        items[(i + d + items.length) % items.length].focus();
      },
      onEsc(){
        if(this.meOpen){ this.meOpen=false; this.$refs.meBtn.focus(); }
        else if(this.demoOpen){ this.demoOpen=false; }
      },
    };
  };

  const ICONS = {
    hjem:'<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M4 10.5 12 4l8 6.5V20h-5.2v-5.5H9.2V20H4z"/>',
    noter:'<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17.5V5.5l10-2v12"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/></g>',
    medlemmer:'<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="8" r="3.3"/><path d="M3 20c.4-3.4 2.9-5.6 6-5.6s5.6 2.2 6 5.6"/><path d="M15.5 4.9a3.2 3.2 0 0 1 0 6.2M17.6 14.6c1.9.7 3.2 2.6 3.4 5.4"/></g>',
    ridderdata:'<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><rect x="3" y="4" width="18" height="5" rx="1.2"/><path d="M5 9v10.5h14V9M10 13h4"/></g>',
    kontakt:'<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.8 7 12 13l8.2-6"/></g>',
  };

  /* Shared icons, usable on every page as <svg><use href="#i-..."/></svg> */
  const SPRITE = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-out" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M8 16 16 8M9.5 8H16v6.5"/></symbol>
  <symbol id="i-play" viewBox="0 0 24 24"><path fill="currentColor" d="M7 4.5v15l12.5-7.5z"/></symbol>
  <symbol id="i-flame" viewBox="0 0 96 112"><path fill="currentColor" d="M48 4c4 17 30 29 30 62a30 30 0 0 1-60 0c0-14 7-23 14-29 0 12 5 18 11 20C40 43 38 26 48 4z"/></symbol>
  <symbol id="i-down" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M5 19.5h14"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" d="M5 12.5 10 17 19 7"/></symbol>
  <symbol id="i-l" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M15 5 8 12l7 7"/></symbol>
  <symbol id="i-r" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="m9 5 7 7-7 7"/></symbol>
  <symbol id="i-up" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="m5 15 7-7 7 7"/></symbol>
  <symbol id="i-dn" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="m5 9 7 7 7-7"/></symbol>
  <symbol id="i-x" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></symbol>
  <symbol id="i-cal" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></g></symbol>
  ${Object.entries(ICONS).map(([k,v]) => `<symbol id="t-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('')}
</svg>`;

  const CHROME = `
<div x-data="meny()" @keydown.escape.window="onEsc()">
  <header class="top">
    <div class="inner">
      <a class="brand" :href="href('hjem')">
        <img :src="img.logo" alt="">
        <span class="bn">Mannskoret <span class="bn2">Arme Riddere</span></span>
      </a>
      <div class="me" @click.outside="meOpen=false">
        <button class="me-btn" x-ref="meBtn" type="button" aria-haspopup="true" :aria-expanded="meOpen" aria-controls="me-menu"
                @click="toggleMe()" @keydown.down.prevent="openMe()">
          <span class="who">
            <b>Ola Nordmann</b>
            <small x-text="$store.app.status==='aktiv' ? '2. tenor · Ridder' : 'Ridder · ypp.com.'"></small>
          </span>
          <span class="portrait"><img :src="img.portrait" alt=""></span>
        </button>
        <ul class="menu" id="me-menu" x-ref="meMenu" x-show="meOpen" x-cloak
            @keydown.down.prevent="moveMenu(1)" @keydown.up.prevent="moveMenu(-1)" @keydown.tab="meOpen=false">
          <li><a href="/app/profil">Vis profil</a></li>
          <li><a href="/app/achievements">Achievements</a></li>
          <li><a href="/app/innstillinger">Innstillinger</a></li>
          <li class="sep" role="presentation"></li>
          <li><a class="quiet" href="/logout">Logg ut</a></li>
        </ul>
      </div>
    </div>
  </header>

  <nav class="mainbar" aria-label="Hovedmeny">
    <div class="inner">
      <ul class="mainbar-list">
        <template x-for="s in MENY" :key="s.k">
          <li>
            <a class="mainbar-btn" :class="SEC===s.k && 'on'" :href="s.k==='hjem' ? href('hjem') : firstHref(s)" :aria-current="SEC===s.k ? 'page' : null">
              <svg class="tab-ic" aria-hidden="true"><use :href="'#t-'+s.k"/></svg>
              <span x-text="s.t"></span>
            </a>
          </li>
        </template>
      </ul>
    </div>
  </nav>

  <template x-if="SEC!=='hjem'">
    <nav class="substrip" :aria-label="'Undermeny ' + sec.t">
      <div class="inner">
        <div class="sub-body" x-show="!IS_ADM || !showAdmin">
          <ul class="sub-links">
            <template x-for="s in subs" :key="s.k">
              <li><a :href="s.ext || href(SEC, s.k)" :class="SUB===s.k && 'on'" :aria-current="SUB===s.k ? 'page' : null"
                     :target="s.ext ? '_blank' : null" :rel="s.ext ? 'noopener' : null"><span x-text="s.t"></span><svg class="ext" x-show="s.ext" aria-label="åpnes i ny fane"><use href="#i-out"/></svg></a></li>
            </template>
          </ul>
          <ul class="sub-admin" x-show="showAdmin">
            <li><a :href="sec.admin && href(SEC, sec.admin.subs[0].k, true)" x-text="sec.admin && sec.admin.t"></a></li>
          </ul>
        </div>
        <div class="sub-body" x-show="IS_ADM && showAdmin">
          <a class="sub-back" :href="firstHref(sec)"><svg aria-hidden="true"><use href="#i-l"/></svg><span x-text="sec.t"></span></a>
          <span class="tag sub-lbl" x-text="sec.admin && sec.admin.t"></span>
          <ul class="sub-links">
            <template x-for="s in (sec.admin ? sec.admin.subs : [])" :key="s.k">
              <li><a :href="href(SEC, s.k, true)" :class="SUB===s.k && 'on'" :aria-current="SUB===s.k ? 'page' : null" x-text="s.t"></a></li>
            </template>
          </ul>
        </div>
      </div>
    </nav>
  </template>
</div>`;

  const GUARD = `
<div class="page" x-data x-show="!kanSe(PAGE)" x-cloak>
  <div class="inner guard">
    <h1 x-text="PAGE.includes('/admin/') ? 'Bare for administratorer' : 'Bare for aktive medlemmer'"></h1>
    <p x-text="PAGE.includes('/admin/') ? 'Denne siden krever en egen rolle. Be styret om tilgang hvis du trenger den.' : 'Denne siden er for aktive medlemmer. Kalender, dokumenter og konserter finner du fortsatt i menyen.'"></p>
    <a class="btn btn-quiet" href="${href('hjem')}">Til Hjem</a>
  </div>
</div>`;

  const DEMO = `
<div class="demo" x-data="{open:false}" @click.outside="open=false" @keydown.escape.window="open=false">
  <button type="button" :aria-expanded="open" aria-controls="demo-panel" @click="open=!open">Demo</button>
  <div class="demo-panel" id="demo-panel" x-show="open" x-cloak>
    <fieldset>
      <legend>Status</legend>
      <label><input type="radio" value="aktiv" x-model="$store.app.status" @change="$store.app.syncMe()"> Aktiv</label>
      <label><input type="radio" value="tidligere" x-model="$store.app.status" @change="$store.app.syncMe()"> Tidligere</label>
    </fieldset>
    <fieldset>
      <legend>Roller</legend>
      <label><input type="checkbox" value="master" x-model="$store.app.roles" @change="$store.app.syncMe()"> master</label>
      <label><input type="checkbox" value="notes" x-model="$store.app.roles" @change="$store.app.syncMe()"> notes</label>
    </fieldset>
    <fieldset>
      <legend>Repertoarer</legend>
      <div class="inl">
        <template x-for="n in ['0','1','3']" :key="n">
          <label><input type="radio" name="repc" :value="n" :checked="$store.app.repCount===n" @change="$store.app.setRepCount(n)"> <span x-text="n"></span></label>
        </template>
      </div>
    </fieldset>
    <button class="reset" type="button" @click="$store.app.reset()">Nullstill demodata</button>
  </div>
</div>`;

  document.body.insertAdjacentHTML('afterbegin', SPRITE + CHROME);
  const main = document.querySelector('main');
  if(main){
    main.setAttribute('x-show', 'kanSe(PAGE)');
    main.insertAdjacentHTML('afterend', GUARD);
  }
  document.body.insertAdjacentHTML('beforeend', DEMO);
})();
