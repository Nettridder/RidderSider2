/* =====================================================================
   leser.js — the document reader overlay.
   Include on pages that open documents (with leser.css), then open it
   from any button with:  @click="$dispatch('open-doc')"
   ===================================================================== */
(function(){
  window.leser = function(){
    return {
      open:false, opener:null,
      show(e){
        this.opener = e.target.closest('button,a');
        this.open = true;
        document.documentElement.style.overflow = 'hidden';
        this.$nextTick(() => requestAnimationFrame(() => this.$refs.close.focus()));
      },
      hide(){
        this.open = false; this.$store.app.docRead = true;
        document.documentElement.style.overflow = '';
        if(this.opener && this.opener.isConnected) this.opener.focus();
      },
      trap(e){
        const f = [...this.$refs.sheet.querySelectorAll('a[href],button:not([disabled]),[tabindex="0"]')];
        const first = f[0], last = f[f.length-1];
        if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
      },
    };
  };

  document.body.insertAdjacentHTML('beforeend', `
<div x-data="leser()" @open-doc.window="show($event)" @keydown.escape.window="open && hide()">
  <div class="reader" x-show="open" x-cloak @keydown.tab="trap($event)">
    <div class="scrim" @click="hide()" aria-hidden="true"></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="doc-title" x-ref="sheet">
      <div class="sheet-h">
        <h2 id="doc-title">Styrereferat 18.09.2026<small>Lagt ut av Paragrafrytteren, 19. sep 2026</small></h2>
        <button class="x" type="button" x-ref="close" @click="hide()">Lukk</button>
      </div>
      <div class="sheet-body" tabindex="0" aria-label="Dokumentets innhold">
        <article class="paper">
          <h3>Referat fra styremøte</h3>
          <p class="meta">Fredag 18. september 2026, kl. 18:00, øvingslokalet i Johanneskirken. Til stede: Erik Moe (leder), Per Hansen, Lars Berg og Anders Lie (referent).</p>
          <h4><span>Sak 23/26</span>Julekonserten 2026</h4>
          <p>Johanneskirken er bekreftet for lørdag 12. desember kl. 19:00. Billettsalget åpner 1. november. Dirigenten ønsker fjorten sanger i programmet, og øvingsplanen for oktober er lagt opp etter det.</p>
          <p class="vedtak">Vedtak: Styret godkjenner programmet og billettprisen på 250 kr.</p>
          <h4><span>Sak 24/26</span>Opptreden i Grieghallen</h4>
          <p>Mannskoret Arme Riddere synger i foajeen lørdag 3. oktober kl. 14:00. Oppmøte 13:15 ved artistinngangen. Antrekk: mørk dress og kortet slips.</p>
          <h4><span>Sak 25/26</span>Semesterfest</h4>
          <p>Festen holdes fredag 16. oktober. Festkomiteen sender invitasjon innen utgangen av september. Styret setter av 6 000 kr.</p>
          <h4><span>Sak 26/26</span>Økonomi</h4>
          <p>Kassereren la frem regnskapet per august. Kontingenten er betalt av 41 av 46 aktive. Påminnelse sendes de resterende.</p>
          <h4><span>Sak 27/26</span>Eventuelt</h4>
          <p>Øvingsappen er tatt i bruk. Styret oppfordrer alle til å registrere øving og markere hvilke sanger de kan. Ukemålet er 60 minutter.</p>
          <p class="sign">Neste styremøte: torsdag 22. oktober 2026.<br>Referent: Anders Lie</p>
        </article>
      </div>
      <div class="sheet-f">
        <p class="hint">PDF, 2 sider</p>
        <a class="btn btn-quiet" href="/app/dokumenter/styrereferat-2026-09-18.pdf" download><svg aria-hidden="true"><use href="#i-down"/></svg>Last ned PDF</a>
      </div>
    </div>
  </div>
</div>`);
})();
