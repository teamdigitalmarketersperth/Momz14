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

test('homepage opening is image-free and preserves its existing title animation and audio', () => {
  const html = read('index.html');
  const hero = html.match(/<section[^>]*id="hero"[\s\S]*?<\/section>/)[0];
  assert.match(hero, /class="container hero-name"/);
  assert.doesNotMatch(hero, /<img\b|hero-image|hero-artwork|background-image/);
  assert.match(hero, /Momz<span class="title-accent">14<\/span>/);
  assert.match(html, /<audio id="momzAudio" src="audio\/floating-cities-kevin-macleod.mp3" preload="metadata" hidden>/);
  assert.doesNotMatch(html, /<audio[^>]*autoplay/);
  const css = read('css/home.css');
  assert.doesNotMatch(css, /site-bg-image|hero-image|hero-artwork|aspect-ratio/);
  assert.match(css, /background: var\(--bg-void\)/);
  assert.match(read('js/animations.js'), /target\.closest\('\.hero-title,/);
  assert.match(css, /\.page-index \.hero-title\s*\{[^}]*animation: momz14-entrance/);
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*animation: none/);
});
