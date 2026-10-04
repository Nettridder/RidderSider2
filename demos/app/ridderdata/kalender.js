/* kalender.js — list (grouped by week) and month grid.
   Events come from RD.EVENTS in felles/data.js (Google Calendar in the real app). */
function kalender(){
  const T = RD.TODAY, FIRST = 8, LAST = 11;   // September–December 2026 have events
  const isoWeek = d => {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
    return Math.ceil(((t - new Date(Date.UTC(t.getUTCFullYear(), 0, 1))) / 864e5 + 1) / 7);
  };
  return {
    view:'list', y:2026, m:9, sel:'2026-10-01',
    get events(){ return RD.EVENTS.filter(e => this.$store.app.status==='aktiv' || e.pub) },
    get weeks(){
      const out = [], by = {}, now = isoWeek(T);
      this.events.filter(e => e.date >= T).forEach(e => {
        const wk = isoWeek(e.date);
        if(!by[wk]){
          const mon = new Date(e.date); mon.setDate(mon.getDate() - ((mon.getDay()+6)%7));
          const sun = new Date(mon); sun.setDate(sun.getDate()+6);
          by[wk] = {wk, items:[], rel: wk===now ? 'Denne uka' : wk===now+1 ? 'Neste uke' : '',
            range: mon.getDate()+'. '+RD.MON_S[mon.getMonth()]+'–'+sun.getDate()+'. '+RD.MON_S[sun.getMonth()]};
          out.push(by[wk]);
        }
        by[wk].items.push(e);
      });
      return out;
    },
    get grid(){
      const first = new Date(this.y, this.m, 1), off = (first.getDay()+6)%7, dim = new Date(this.y, this.m+1, 0).getDate();
      return Array.from({length: Math.ceil((off+dim)/7)*7}, (_, i) => {
        const d = new Date(this.y, this.m, 1-off+i), k = RD.iso(d), inMonth = d.getMonth()===this.m;
        return {date:d, iso:k, inMonth, today:k===RD.iso(T), past:d<T, events: inMonth ? this.events.filter(e => e.iso===k) : []};
      });
    },
    get title(){ return RD.cap(RD.MONTHS[this.m]) + ' ' + this.y },
    get selDate(){ const [y,m,d] = this.sel.split('-').map(Number); return new Date(y, m-1, d) },
    get dayEvents(){ return this.events.filter(e => e.iso===this.sel) },
    get canPrev(){ return this.m > FIRST },
    get canNext(){ return this.m < LAST },
    shift(d){
      this.m = Math.max(FIRST, Math.min(LAST, this.m + d));
      const inM = this.events.filter(e => e.date.getMonth()===this.m);
      const f = inM.find(e => e.date >= T) || inM[0];
      this.sel = f ? f.iso : RD.iso(new Date(this.y, this.m, 1));
    },
    kind(e){ return e.pub ? 'pub' : e.w==='Øving' ? '' : 'oth' },
    cellLabel(c){ return RD.longDate(c.date) + (c.events.length ? ', ' + c.events.length + (c.events.length===1 ? ' hendelse' : ' hendelser') : '') },
  };
}
