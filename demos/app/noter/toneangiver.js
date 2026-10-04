/* toneangiver.js — plays starting notes with WebAudio.
   Click a song: all its notes in order. Click a chip: that one note. */
function toneangiver(){
  const STEP = .8, DUR = 1.1;
  return {
    q:'', playing:{s:null, i:null}, _osc:[], _tm:[],
    get A(){ return this.$store.app },
    get list(){
      const q = this.q.trim().toLowerCase();
      return this.A.visibleSongs.filter(s => s.pitch.length && (!q || (s.t+' '+s.g.join(' ')).toLowerCase().includes(q)));
    },
    // "B♭3" -> {l:'B', acc:'♭', o:'3'} so the accidental can be styled
    parts(n){ return {l:n[0], acc:n.slice(1,-1), o:n.slice(-1)} },
    freq(n){
      const m = /^([A-G])([♭b♯#]?)(\d)$/.exec(n); if(!m) return 220;
      const semi = {C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1]] + (m[2]==='♭'||m[2]==='b' ? -1 : m[2] ? 1 : 0);
      return 440 * Math.pow(2, (12 * (+m[3] + 1) + semi - 69) / 12);
    },
    stop(){
      this._osc.forEach(o => { try{ o.stop(); }catch(_){} });
      this._tm.forEach(clearTimeout);
      this._osc = []; this._tm = []; this.playing = {s:null, i:null};
    },
    playSeq(s, idxs){
      this.stop();
      try{
        this.ac = this.ac || new (window.AudioContext || window.webkitAudioContext)();
        if(this.ac.state==='suspended') this.ac.resume();
        const t0 = this.ac.currentTime + .03;
        idxs.forEach((i, n) => {
          const t = t0 + n*STEP, o = this.ac.createOscillator(), g = this.ac.createGain();
          o.type = 'triangle'; o.frequency.value = this.freq(s.pitch[i].n);
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.25, t+.04); g.gain.exponentialRampToValueAtTime(.001, t+DUR);
          o.connect(g).connect(this.ac.destination); o.start(t); o.stop(t+DUR+.05);
          this._osc.push(o);
        });
      }catch(_){}
      this.playing = {s:s.id, i:idxs[0]};
      idxs.forEach((i, n) => { if(n) this._tm.push(setTimeout(() => { this.playing = {s:s.id, i}; }, n*STEP*1000)); });
      this._tm.push(setTimeout(() => { this.playing = {s:null, i:null}; }, ((idxs.length-1)*STEP + DUR) * 1000));
    },
    playSong(s){ this.playSeq(s, s.pitch.map((_, i) => i)); },
    playNote(s, i){ this.playSeq(s, [i]); },
  };
}
