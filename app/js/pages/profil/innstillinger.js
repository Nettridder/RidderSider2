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
