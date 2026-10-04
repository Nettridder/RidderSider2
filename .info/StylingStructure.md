# Styling & Frontend Guide

This document explains how the visual style and interactivity of this site work,
and how to add new pages or features so that everything stays consistent and
easy to read — no matter who's adding it.

## Philosophy

Two rules govern everything here:

1. **Style is global by default.** Colors, fonts, spacing, and the look of
   common things (buttons, cards, links, nav) live in one place and are
   *referenced*, never repeated. Change it once, it changes everywhere.
2. **Interactivity uses Alpine.js.** No build step, no compiling, no
   `npm install`. You write behavior directly as HTML attributes. If you can
   read HTML, you can mostly read what a page does.

If you're ever unsure whether something should be global or page-specific:
default to global. Page-specific styling is the exception, used only when a
page genuinely needs to look or behave differently on purpose.

---

## How global styling works

All shared design values live in one file as **CSS variables**:

```css
/* css/variables.css */
:root {
  --color-primary: #2c5f6f;
  --color-text: #1a1a1a;
  --color-background: #ffffff;
  --color-muted: #6b6b6b;

  --font-body: 'Georgia', serif;
  --font-heading: 'Georgia', serif;

  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 2rem;

  --radius: 6px;
}
```

Every other stylesheet uses these variables instead of writing raw values:

```css
/* css/base.css */
body {
  font-family: var(--font-body);
  color: var(--color-text);
  background: var(--color-background);
}

.button {
  background: var(--color-primary);
  border-radius: var(--radius);
  padding: var(--spacing-sm) var(--spacing-md);
}
```

**Why this matters:** if the choir ever wants a new accent color, updating
`--color-primary` in one file updates every button, link, and highlight across
the whole site. Nobody has to hunt through dozens of files, and nobody can
introduce a slightly-different shade of blue by accident.

`css/base.css` is where the shared look of common elements lives — typography,
buttons, cards, navigation, form fields. Every page loads this file. This is
"how the site looks" in one place.

### Page-specific styling (the customization escape hatch)

Sometimes a page genuinely needs something different — a wider layout, an
extra decorative element, unique spacing for a photo gallery. That's fine, but
it's the exception, not the rule:

- Give the page its own small stylesheet: `css/pages/<page-name>.css`
- It should **only** contain what's actually unique to that page
- It still uses the global variables (`var(--color-primary)`, etc.) rather
  than inventing new colors or fonts
- Load it *after* `base.css`, so it can override specific things on top of the
  shared foundation without duplicating it

If a page-specific file starts looking like it's redefining things that
should apply everywhere, that's a signal to move that rule into `base.css`
instead.

---

## How Alpine.js is used here

Alpine.js is loaded once, on every page, via a `<script>` tag — no build step:

```html
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js"></script>
```

Interactivity is written directly in the HTML using Alpine's attributes:

```html
<div x-data="{ open: false }">
  <button @click="open = !open">Toggle details</button>
  <p x-show="open">Here are the details.</p>
</div>
```

There's no separate "logic file" to go find for something this small — the
behavior lives right next to the HTML it affects, which is the point.

For anything more than a few lines of logic, pull it into a small named
function instead of writing it all inline:

```html
<div x-data="voiceFilter()">
  ...
</div>

<script>
function voiceFilter() {
  return {
    selected: 'all',
    filterBy(group) {
      this.selected = group;
    }
  };
}
</script>
```

Small, reusable pieces of behavior like this should live in
`js/components/<name>.js`, one file per component, named after what it does
(`voice-filter.js`, `event-calendar.js`). A page includes only the component
files it actually needs.

---

## Adding something new: the standard pattern

Whether it's a new page or a new feature on an existing page, follow the same
shape:

1. **Start with plain HTML.** Write the content and structure first, using
   ordinary elements (`<button>`, `<nav>`, `<article>`) — don't add classes or
   custom styling yet.
2. **Link the global files.** Every page includes `variables.css`,
   `base.css`, and the Alpine.js script tag. This alone should make it look
   reasonably consistent with the rest of the site.
3. **Add a page-specific stylesheet only if needed.** If the page needs
   something the global styles don't cover, create
   `css/pages/<page-name>.css` and load it after `base.css`. Use the existing
   variables inside it rather than new hardcoded values.
4. **Add interactivity with Alpine attributes directly in the HTML.** For
   anything beyond a couple of lines, move the logic into a named function in
   `js/components/<name>.js` and link that file from the page.
5. **Check it against an existing page.** Open a page that already works and
   compare structure — new pages should look like siblings of existing ones,
   not like they were built from a different set of rules.

### Example: implementing a new page

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>New Page — Choir Name</title>

  <!-- Global styling, always included -->
  <link rel="stylesheet" href="/css/variables.css">
  <link rel="stylesheet" href="/css/base.css">

  <!-- Only if this page needs its own tweaks -->
  <link rel="stylesheet" href="/css/pages/new-page.css">

  <!-- Alpine.js, always included -->
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js"></script>

  <!-- Only if this page uses a specific interactive component -->
  <script defer src="/js/components/new-page-behavior.js"></script>
</head>
<body>

  <nav><!-- shared nav markup, same as every other page --></nav>

  <main>
    <h1>New Page Title</h1>

    <div x-data="newPageBehavior()">
      <!-- content and interactivity here -->
    </div>
  </main>

  <footer><!-- shared footer markup --></footer>

</body>
</html>
```

Nothing here needs compiling or building — save the file, and it works
exactly as written. A new page should almost always be this simple: mostly
shared pieces (nav, footer, global CSS, Alpine), plus a small, clearly-named
amount of content and behavior that's actually new.