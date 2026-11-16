const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'inspirations.html'), 'utf8');
const expected = {
  musical: 'Ludwig Goransson|Han Zimmer|deadmau5|Paul Oakenfield|Metroboomin|The Weekend|Daniel Pemberton|Beethoven|Chopin|Bach|Paganini|Stormz|Tracey Chapman|Bob Dylan|Peter Gabriel',
  visual: 'Rembrandt|Goya|Katie Kollawitz|Frank Miller|Goseki Kojima|Degas|Rodin|Théodore Géricault|Picasso|Monet|Francis Bacon|Henry Fuseli|Jean Girard|Casper David Friedrich|Daumier|Titania|Velazquez|Rothko|Delacroix|Donovan Fisher',
  literature: 'Joseph Campbell|Carl Jung|Neil deGrasse Tyson|Heinrich Neuhaus|Baudelaire|Charles Bukowski|Walt Whitman|Henry Berginson|Plato|Sam Keen|Samuel Becket|Frederich Nietzsche|Søren Kierkegaard|Homer'
};

test('Inspirations includes all 49 exact client names in three labelled sections', () => {
  let count = 0;
  for (const [id, names] of Object.entries(expected)) {
    const section = html.match(new RegExp(`<section id="${id}"[\\s\\S]*?</section>`))?.[0];
    assert(section, id);
    assert(section.includes(`aria-labelledby="${id}-title"`));
    const actual = [...section.matchAll(/<li>([^<]+)<\/li>/g)].map(match => match[1]);
    assert.deepEqual(actual, names.split('|'));
    count += actual.length;
  }
  assert.equal(count, 49);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
});

test('Inspirations uses seven-page navigation and an honest Odyssey placeholder', () => {
  const mainNav = html.match(/<nav class="desktop-nav-wrap[\s\S]*?<\/nav>/)[0];
  const mobileNav = html.match(/<ul class="mobile-drawer-nav[\s\S]*?<\/ul>/)[0];
  for (const nav of [mainNav, mobileNav]) {
    assert.match(nav, /href="inspirations\.html" class="(?:header-nav-link|mobile-drawer-link) active" aria-current="page"/);
    for (const file of ['index','about','music','studio','events','contact']) assert(nav.includes(`href="${file}.html"`));
  }
  assert.match(html, /<button[^>]*disabled[^>]*>Explore Odyssey/);
  assert.match(html, /Link placeholder — destination to be supplied/);
  assert.doesNotMatch(html, /http-equiv="refresh"|href="[^"]*odyssey/i);
});

test('Inspirations local links, assets, IDs and metadata are valid', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const [, value] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^[a-z]+:/i.test(value)) continue;
    if (value.startsWith('#')) assert(ids.includes(value.slice(1)), value);
    else assert(fs.existsSync(path.join(root, value)), value);
  }
  for (const attr of ['name="description"', 'property="og:title"', 'property="og:description"']) assert(html.includes(attr));
  assert(html.includes('css/inspirations.css'));
  assert(html.includes('js/main.js'));
});
