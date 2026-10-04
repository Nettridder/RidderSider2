/* =====================================================================
   admin.js — shared by the admin pages.
   1. <div data-use="tpl-id:formVar:idPrefix"> is filled with the
      <template id="tpl-id"> markup, so one form serves both "add" and
      "edit". Runs before Alpine starts.
   2. <div data-drawer> ... </div> gets the edit-drawer shell around it.
   3. adminBase() gives a page the drawer, confirm and message helpers:
        function side(){ return { ...adminBase(), ...your stuff } }
   ===================================================================== */
(function(){
  (function expand(root){
    root.querySelectorAll('template').forEach(t => { if(!(t.id || '').startsWith('tpl-')) expand(t.content); });
    root.querySelectorAll('[data-use]').forEach(el => {
      const [tpl, F, P] = el.dataset.use.split(':');
      el.innerHTML = document.getElementById(tpl).innerHTML.replaceAll('__F__', F).replaceAll('__P__', P);
      el.removeAttribute('data-use');
      expand(el);
    });
  })(document);

  document.querySelectorAll('[data-drawer]').forEach(el => {
    el.outerHTML = `
<div class="drawer" x-show="drawer" x-cloak @keydown.tab="trap($event)" @keydown.escape.window="drawer && (confirmDel ? confirmDel=false : closeDrawer())">
  <div class="scrim" @click="closeDrawer()" aria-hidden="true"></div>
  <aside class="dpanel" role="dialog" aria-modal="true" aria-labelledby="dr-h" x-ref="dpanel">
    <div class="sheet-h">
      <h2 id="dr-h"><span x-text="drawerTitle"></span><small x-text="drawerSub"></small></h2>
      <button class="x" type="button" x-ref="drClose" @click="closeDrawer()">Lukk</button>
    </div>
    ${el.innerHTML}
  </aside>
</div>`;
  });

  window.adminBase = function(){
    return {
      q:'', flash:'', drawer:null, confirmDel:false, _opener:null, _k:0,
      say(msg){ this.flash=''; this.$nextTick(() => { this.flash = msg; }); },
      toggleIn(arr, v){ const i = arr.indexOf(v); i<0 ? arr.push(v) : arr.splice(i,1); },
      focusFirstInvalid(){ this.$nextTick(() => { const el = document.querySelector('[aria-invalid="true"]'); el && el.focus(); }); },
      focusHeading(){ this.$nextTick(() => { const h = document.querySelector('main h1'); h && h.focus(); }); },
      openDrawer(kind, e){
        this._opener = e && e.currentTarget;
        this.confirmDel = false; this.drawer = kind;
        document.documentElement.style.overflow = 'hidden';
        this.$nextTick(() => requestAnimationFrame(() => this.$refs.drClose.focus()));
      },
      closeDrawer(restore = true){
        this.drawer = null; this.confirmDel = false;
        document.documentElement.style.overflow = '';
        if(restore && this._opener && this._opener.isConnected) this._opener.focus();
      },
      trap(e){
        const box = this.$refs.dpanel;
        const f = [...box.querySelectorAll('a[href],button:not([disabled]),input:not([type=file]),select,textarea')].filter(el => el.getClientRects().length);
        if(!f.length) return;
        const first = f[0], last = f[f.length-1];
        if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
      },
    };
  };
})();
