/* Global script for the public pages (index.html, book-oss.html, medlemmer.html): facts and links,
   header/menu/footer, the contact/booking form and scroll effects. Same structure as app/js/global.js.
   On the front page the menu scrolls to its sections and marks the one you are looking at;
   on the other pages it marks the page you are on.

   Where code goes:
   1. Used by one page only   -> a <script> / <style> section in that page's HTML.
   2. Used by several pages   -> js/global.js / css/global.css.
   3. New page                -> one HTML file (copy the <head> of an existing page) + one line in MENU below.
      New section on the front page -> a <section id="..."> in index.html + one line in MENU below.
   Effects from the old site stay as their own files: js/countries.js, js/confetti.js, js/easter-egg.js.

   Every page loads css/global.css + js/global.js first, then the effect scripts, then Alpine.
   Interactivity uses Alpine.js (x-data, x-text, x-for ...), like the app. */

/* ==================== Facts and links (edit here) ==================== */

const SITE = {
  founded: 1996,
  members: 24,                       // "Sangglade Studenter" and the "Om oss" text — update by hand
  countriesConquered: 15,            // "Land Erobret" — keep in step with the flag list in js/countries.js
  knightsAllTime: 338,               // "Antall Riddere": everyone who has ever been a member
  contact: {
    address: 'Studentkulturhuset i Bergen AS, Postboks 1822 Håkonsgaten, Bergen 5866',
    email: 'rittmester@armeriddere.no',
    phone: '482 86 565',
  },
  social: [                          // Remove a line to hide that icon. Icons are in ICONS below.
    { key: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@ArmeRiddere' },
    { key: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/mannskoretarmeriddere' },
    { key: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/armeriddere/' },
    { key: 'tiktok', label: 'TikTok', url: 'https://www.tiktok.com/@armeriddere' },
  ],
};

const API_URL = '/api/';
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Media rule (same as the app): "http..." = external URL, anything else = a path inside storage/ served by api/media.php. */
const mediaUrl = path => /^https?:\/\//.test(path) ? path : API_URL + 'media.php?path=' + encodeURIComponent(path);
const phoneHref = phone => 'tel:' + phone.replace(/\s/g, '');

/* SVG icons (no icon font needed). Used with x-html="ICONS.mail" etc. */
const ICONS = {
  place: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 5h20v14H2zm2 2v.5l8 5.5 8-5.5V7zm16 3.4-8 5.5-8-5.5V17h16z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11 11 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.3.2 2.5.6 3.6a1 1 0 0 1-.25 1z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8V6.5c0-.7.2-1 1.2-1H17V2h-2.8C11.3 2 10 3.7 10 6v2H8v3.5h2V22h4V11.5h2.8L17 8z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM17.5 5.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.5 2h-3.2v12.8a2.8 2.8 0 1 1-2.8-2.8c.3 0 .6 0 .8.1V8.8a6 6 0 1 0 5.2 5.9V8.5a7 7 0 0 0 4 1.3V6.6a4 4 0 0 1-4-4.6z"/></svg>',
};

/* ==================== Menu and layout ==================== */

const PAGE_PATH = document.body.dataset.page || '';

/* "section" = a <section id="..."> on the front page (scrolled to there, linked to from the other pages).
   "page" = which page the item belongs to, so it is marked when you are on that page.
   "href" = a link to a page. The front page shows every item; the other pages only the items with an href. */
const MENU = [
  { label: 'Hjem', page: 'hjem', section: 'hero', href: '/' },
  { label: 'Om oss', page: 'hjem', section: 'about' },
  { label: 'Fakta', page: 'hjem', section: 'facts' },
  { label: 'Kontakt oss', page: 'hjem', section: 'contact' },
  { label: 'Book Oss', page: 'book-oss', href: '/book-oss.html' },
  { label: 'Medlemmer', page: 'medlemmer', href: '/medlemmer.html' },
];

const itemHref = item => item.href || (PAGE_PATH === 'hjem' ? '#' : '/#') + item.section;

function siteLayout() {
  return {
    menu: MENU.filter(item => PAGE_PATH === 'hjem' || item.href),
    menuOpen: false,
    scrolled: false,
    currentSection: 'hero',
    /* Front page: the section whose top has passed below the header. Other pages: the page itself. */
    isActive(item) {
      if (PAGE_PATH !== 'hjem') return item.page === PAGE_PATH;
      return item.section === this.currentSection;
    },
    /* Header shrinks after 100px. */
    onScroll() {
      this.scrolled = window.scrollY > 100;
      if (PAGE_PATH !== 'hjem') return;
      const line = window.scrollY + 120;
      this.currentSection = MENU.filter(item => { const section = item.section && document.getElementById(item.section); return section && section.offsetTop <= line; })
        .map(item => item.section).pop() || 'hero';
    },
    init() {
      this.onScroll();
      this.$watch('menuOpen', open => document.body.classList.toggle('mobile-nav-active', open));
    },
  };
}

const SITE_HEADER = `
<div x-data="siteLayout()" @scroll.window="onScroll()" @keydown.escape.window="menuOpen = false">
  <header id="header" :class="scrolled && 'header-fixed'">
    <div class="container">
      <a href="/" aria-label="Mannskoret Arme Riddere – til forsiden"><span class="logo-mask"></span></a>
      <nav aria-label="Hovedmeny">
        <ul class="nav-menu">
          <template x-for="item in menu" :key="item.label">
            <li><a :href="itemHref(item)" :class="isActive(item) && 'active'" x-text="item.label"></a></li>
          </template>
        </ul>
      </nav>
    </div>
  </header>
  <button id="mobile-nav-toggle" aria-label="Meny" aria-controls="mobile-nav" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen">&#9776;</button>
  <nav id="mobile-nav" aria-label="Meny">
    <template x-for="item in menu" :key="item.label">
      <a :href="itemHref(item)" x-text="item.label" @click="menuOpen = false"></a>
    </template>
  </nav>
  <!-- css/global.css hides this by default, so it is shown with an inline style instead of x-show -->
  <a href="#" class="back-to-top" aria-label="Til toppen" :style="scrolled && 'display: block'" @click.prevent="window.scrollTo({ top: 0 })">&#8963;</a>
</div>`;

const SITE_FOOTER = `
<footer id="footer">
  <div class="container">
    <div><a href="/app/">&copy; <strong>Mannskoret Arme Riddere</strong></a></div>
    <div class="cookie"><a href="/privacy-policy.html"><small>Vår cookie policy</small></a></div>
  </div>
</footer>`;

function buildLayout() {
  document.body.insertAdjacentHTML('afterbegin', SITE_HEADER);
  document.body.insertAdjacentHTML('beforeend', SITE_FOOTER);
}

/* ==================== Contact and booking form ==================== */

/* <div class="contact-form" x-data="contactForm('contact' | 'booking')"> (index.html and book-oss.html) — sends to api/contact.php, which emails the choir. */
function contactForm(kind) {
  const empty = () => ({ name: '', email: '', subject: '', message: '', website: '' });   // website = honeypot for spam bots
  return {
    fields: empty(),
    sending: false,
    sent: false,
    error: '',
    async send() {
      this.sending = true;
      this.sent = false;
      this.error = '';
      try {
        const response = await fetch(API_URL + 'contact.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...this.fields, kind }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Meldingen kunne ikke sendes.');
        this.fields = empty();
        this.sent = true;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.sending = false;
      }
    },
  };
}

/* ==================== Scroll effects ==================== */

/* Elements with class="fade-in" fade in the first time they scroll into view (styles in css/global.css).
   Content added later (e.g. the member list) calls watchFadeIns(itsElement) after it is drawn. */
const fadeInObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    fadeInObserver.unobserve(entry.target);
  });
}, { threshold: 0.1 });

function watchFadeIns(root = document) {
  root.querySelectorAll('.fade-in:not(.visible)').forEach(element => fadeInObserver.observe(element));
}

/* ==================== Page start ==================== */

/* Before Alpine reads the page: add header and footer. After Alpine has drawn it: start the fade-ins. */
document.addEventListener('alpine:init', buildLayout);
document.addEventListener('alpine:initialized', () => watchFadeIns());
