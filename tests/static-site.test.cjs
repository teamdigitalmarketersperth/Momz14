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
    assert(logos.every(node => node.src === 'images/logo-lp.jpeg' && node.width === '1600' && node.height === '1600'));
    const nav = nodes.filter(node => node.tag === 'a' && hasClass(node, 'header-nav-link')).map(node => node.href);
    assert.deepEqual(nav, pages);
    for (const node of nodes) {
      if (node.tag === 'img') assert(node.alt && node.width && node.height, 'image descriptions and dimensions');
      if (node.tag === 'label') assert(ids(file).includes(node.for), 'label connects to a field');
      for (const attr of ['href','src','action','data-audio-src']) {
        const value = node[attr];
        if (!value || /^(?:[a-z][\w+.-]*:|\/\/)/i.test(value)) continue;
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

test('site uses static data and native audio without remote data calls or submission', () => {
  const js = read('js/main.js');
  assert.doesNotMatch(js, removedRuntime);
  assert.doesNotMatch(js, /\b(?:fetch|XMLHttpRequest|FormData|WebSocket)\s*\(/);
  assert.doesNotMatch(js, /\b(?:localStorage|indexedDB)\b/);
  assert.match(js, /getElementById\('momzAudio'\)/);
  for (const file of ['index.html','music.html']) {
    assert(documents[file].some(node => node.tag === 'audio' && node.id === 'momzAudio'));
    assert(documents[file].some(node => hasClass(node, 'music-player-panel') && 'data-audio-src' in node));
  }
  assert(documents['music.html'].filter(node => hasClass(node, 'music-track-row')).every(node => 'data-audio-src' in node));
  const form = documents['contact.html'].find(node => node.tag === 'form');
  assert.equal(form.action, 'mailto:booking@momz14.com');
  assert.equal(form.method, 'get');
});

test('shared background and responsive behavior are retained', () => {
  const css = read('css/style.css');
  assert.equal((css.match(/url\('\.\.\/images\/bg-img\.jpeg'\)/g) || []).length, 1);
  for (const file of ['css/style.css','css/responsive.css']) {
    for (const [,value] of read(file).matchAll(/url\(['"]?([^)'"\s]+)/g)) {
      assert(fs.existsSync(path.resolve(root, path.dirname(file), value)), `${file}: missing ${value}`);
    }
  }
  assert.match(css, /aspect-ratio: 1;/);
  assert.match(read('css/responsive.css'), /prefers-reduced-motion/);
});

test('removed runtime directories and executable files are absent', () => {
  for (const dir of ['admin','api','database','uploads','graphify-out']) assert(!fs.existsSync(path.join(root, dir)), dir);
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
  assert(!walk(root).some(file => /\.(?:php\d*|sql)$/i.test(file)));
  assert.doesNotMatch(read('robots.txt'), removedRuntime);
  assert.doesNotMatch(read('docs/preview.html'), removedRuntime);
});
