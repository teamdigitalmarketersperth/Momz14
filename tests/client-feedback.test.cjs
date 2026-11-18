const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const pages = ['index','about','music','studio','events','contact','inspirations'];
const read = file => fs.readFileSync(file, 'utf8');

test('requested copy is removed across the public pages without leaving empty sections', () => {
  const removed = /The Four Pillars of Sound|Forging the genesis of new sound fields|Rejecting standard genre conventions|Unlike software-based workstations|Raw Oscillation|Modular Patching|Rhythmic Infusion|Dynamic Summing|The Sound Field Concept|Rather than writing conventional|Years of quiet|Inside the Living Studio|Discover the tactile environment/;
  for (const page of pages) {
    const html = read(`${page}.html`);
    assert.doesNotMatch(html, removed, page);
    assert.doesNotMatch(html, /<section\b[^>]*>\s*<\/section>/);
  }
  assert.match(read('about.html'), /Momz14 has created a sound through years of dedication/);
});

test('homepage keeps its full-colour background and its character entrance without changing audio', () => {
  const html = read('index.html');
  const hero = html.match(/<section[^>]*id="hero"[\s\S]*?<\/section>/)[0];
  assert.match(hero, /class="container hero-name"/);
  assert.doesNotMatch(hero, /<img\b|hero-image|hero-artwork|background-image/);
  const title = hero.match(/<h1[^>]*class="hero-title"[^>]*>([\s\S]*?)<\/h1>/)[1];
  assert.equal(title.replace(/<[^>]+>/g, ''), 'Momz14');
  assert.equal((title.match(/<span/g) || []).length, 6);
  assert.match(hero, /aria-label="Momz14"/);
  assert.match(html, /<audio id="momzAudio" src="audio\/floating-cities-kevin-macleod.mp3" preload="metadata" hidden>/);
  assert.doesNotMatch(html, /<audio[^>]*autoplay/);
  const css = read('css/home.css');
  const background = read('css/style.css').match(/body::before\s*\{([^}]*)\}/)[1];
  assert.match(background, /opacity: 1/);
  assert.match(background, /background: var\(--site-bg-image\) center \/ cover no-repeat/);
  assert.doesNotMatch(background, /gradient|filter:/);
  assert.doesNotMatch(css, /\.page-index::before/);
  assert.match(css, /font-variant-numeric: lining-nums/);
  assert.match(css, /\.page-index \.hero-title\s*\{[^}]*font-family: var\(--font-body\)/);
  assert.match(read('js/animations.js'), /target\.closest\('\.hero-title,/);
  assert.match(css, /\.page-index \.hero-title > span\s*\{[^}]*animation: momz14-entrance/);
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*animation: none/);
});
