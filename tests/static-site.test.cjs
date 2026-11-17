/* Static integrity checks using Node's standard library only. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const pages = ['index.html','about.html','music.html','studio.html','events.html','contact.html','inspirations.html'];
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const tags = html => [...html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)].map(([,tag,raw]) => ({ tag: tag.toLowerCase(), raw,
  ...Object.fromEntries([...raw.matchAll(/([\w-]+)="([^"]*)"/g)].map(([,key,value]) => [key, value])) }));
const documents = Object.fromEntries(pages.map(file => [file, tags(read(file))]));
const ids = file => documents[file].filter(tag => tag.id).map(tag => tag.id);
const hasClass = (tag, value) => (tag.class || '').split(/\s+/).includes(value);
const removedRuntime = /<\?php|\.php\b|\b(?:mysql|mariadb|ffmpeg|pdo|syncDynamicMusic)\b|(?:api|admin|database|uploads)\//i;

for (const file of pages) {
  test(`${file}: local assets, links, logo, headings and shared styles remain intact`, () => {
    const nodes = documents[file];
    assert.equal(new Set(ids(file)).size, ids(file).length, 'unique IDs');
    assert.equal(nodes.filter(node => node.tag === 'h1').length, 1);
    assert(nodes.some(node => node.tag === 'a' && hasClass(node, 'skip-link')));
    for (const href of ['css/style.css','css/responsive.css']) assert(nodes.some(node => node.tag === 'link' && node.href === href));
    const logos = nodes.filter(node => node.tag === 'img' && (hasClass(node, 'header-logo-img') || hasClass(node, 'footer-logo-img')));
    assert.equal(logos.length, 3);
    assert(logos.every(node => node.src === 'images/new-logo.png' && node.width === '500' && node.height === '500'));
    const nav = nodes.filter(node => node.tag === 'a' && hasClass(node, 'header-nav-link')).map(node => node.href);
    assert.deepEqual(nav, pages);
    for (const node of nodes) {
      if (node.tag === 'img') assert(node.alt && node.width && node.height, 'image descriptions and dimensions');
      if (node.tag === 'label') assert(ids(file).includes(node.for), 'label connects to a field');
      for (const attr of ['href','src','action','data-audio-src']) {
        const value = node[attr];
        if (!value || /^(?:[a-z][\w+.-]*:|\/\/)/i.test(value) || (attr === 'action' && value === '/contact')) continue;
        assert.notEqual(value, '#');
        const [pathname, fragment] = value.split('#');
        const target = pathname ? decodeURIComponent(pathname.split('?')[0]) : file;
        assert(fs.existsSync(path.join(root, target)), `${file}: missing ${value}`);
        if (fragment && documents[target]) assert(ids(target).includes(fragment), `${file}: broken anchor ${value}`);
      }
    }
    assert.doesNotMatch(read(file), removedRuntime);
  });
}

test('site uses native audio and the shared Node contact endpoint', () => {
  const js = read('js/main.js');
  assert.doesNotMatch(js, removedRuntime);
  assert.doesNotMatch(js, /\b(?:XMLHttpRequest|WebSocket)\s*\(/);
  assert.doesNotMatch(js, /\b(?:localStorage|indexedDB)\b/);
  assert.match(js, /getElementById\('momzAudio'\)/);
  for (const file of ['index.html','music.html']) {
    assert(documents[file].some(node => node.tag === 'audio' && node.id === 'momzAudio'));
    assert(documents[file].some(node => hasClass(node, 'music-player-panel') && 'data-audio-src' in node));
  }
  assert(documents['music.html'].filter(node => hasClass(node, 'music-track-row')).every(node => 'data-audio-src' in node));
  const form = documents['contact.html'].find(node => node.tag === 'form');
  assert.equal(form.action, '/contact');
  assert.equal(form.method, 'post');
});

test('shared background and responsive behavior are retained', () => {
  const css = read('css/style.css');
  assert.equal((css.match(/url\(['"]\.\.\/images\/bg-img\.jpeg['"]\)/g) || []).length, 1);
  for (const file of ['css/style.css','css/responsive.css']) {
    for (const [,value] of read(file).matchAll(/url\(['"]?([^)'"\s]+)/g)) {
      assert(fs.existsSync(path.resolve(root, path.dirname(file), value)), `${file}: missing ${value}`);
    }
  }
  assert.match(css, /aspect-ratio: 1;/);
  assert.match(read('css/responsive.css'), /prefers-reduced-motion/);
});

test('removed runtime directories and executable files are absent', () => {
  for (const dir of ['admin','api','database','uploads','graphify-out','vendor']) assert(!fs.existsSync(path.join(root, dir)), dir);
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? (['.git', 'node_modules'].includes(entry.name) ? [] : walk(path.join(dir, entry.name))) : [path.join(dir, entry.name)]);
  assert(!walk(root).some(file => /\.(?:php\d*|sql)$/i.test(file)));
  for (const file of ['composer.json', 'composer.lock']) assert(!fs.existsSync(path.join(root, file)));
  assert.doesNotMatch(read('robots.txt'), removedRuntime);
  assert.doesNotMatch(read('docs/preview.html'), removedRuntime);
});

test('contact forms appear only on the homepage and Contact Us page and reuse one handler', () => {
  const original = read('contact.html');
  const form = html => html.match(/<form id="momzContactForm"[\s\S]*?<\/form>/)[0].replace(/^[ \t]+$/gm, '');
  const support = html => html.match(/<noscript>[\s\S]*?<form id="momzContactForm"/)[0];
  for (const file of pages) {
    const html = read(file);
    assert.equal((html.match(/id="momzContactForm"/g) || []).length, ['index.html', 'contact.html'].includes(file) ? 1 : 0, `${file}: form count`);
    if (file !== 'index.html') {
      assert(!html.includes('section-contact-form'), `${file}: no additional form section`);
      continue;
    }
    assert.equal(form(html), form(original), `${file}: identical fields and validation`);
    assert.equal(support(html), support(original), `${file}: identical notices and feedback`);
    assert.equal((html.match(/id="momzContactForm"/g) || []).length, 1);
    assert.match(html, /<section class="section-contact-form" aria-label="Contact form">[\s\S]*?<\/form>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/section>\s*<\/main>\s*<!--[\s\S]*?-->\s*<footer/);
    assert.equal(documents[file].filter(node => node.tag === 'script' && node.src === 'js/main.js').length, 1);
  }
  assert(!original.includes('section-contact-form'), 'original contact page stays unchanged');
});
