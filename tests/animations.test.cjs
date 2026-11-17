const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function fixture({ reduced = false, supported = true, opening = false } = {}) {
  const group = { parentElement: null }, calls = [], observed = [], unobserved = [];
  let observer, ready, preferenceChange;
  const aosCalls = [];
  const preference = { matches: reduced, addEventListener: (_, fn) => { preferenceChange = fn; } };
  class Element {
    constructor(tagName, options = {}) { Object.assign(this, { tagName, group, parentElement: group }, options); }
    closest(selector) { if (selector === '[data-aos]') return this.tagName === 'IMG' ? this : null; return selector === 'section, footer, header' ? this.group : this.excluded ? {} : null; }
    querySelector() { return this.interactive ? {} : null; }
    getBoundingClientRect() { return { width: 200, height: 40, top: this.opening ? 100 : 1500, bottom: this.opening ? 140 : 1540 }; }
    animate(frames, timing) {
      let finish, reject;
      const animation = { finished: new Promise((resolve, no) => { finish = resolve; reject = no; }),
        finish() { finish(); }, cancel() { this.cancelled = true; reject(new Error('Cancelled')); } };
      calls.push({ target: this, frames, timing, animation });
      return animation;
    }
  }
  const heading = new Element('H2', { opening }), paragraph = new Element('P', { opening });
  const image = new Element('IMG', { opening }), links = new Element('DIV', { interactive: true });
  const caption = new Element('FIGCAPTION'), nestedLink = new Element('A', { parentElement: links });
  const protectedText = new Element('P', { excluded: true });
  const emptyIcon = new Element('SPAN', { textContent: '' });
  const disabledButton = new Element('BUTTON', { disabled: true });
  const nodes = [heading, paragraph, image, links, caption, nestedLink, protectedText, emptyIcon, disabledButton];
  const window = { AOS: { init: options => aosCalls.push(options) }, innerHeight: 1000, matchMedia: () => preference, IntersectionObserver: supported ? class {
    constructor(callback, options) { observer = this; this.callback = callback; this.options = options; }
    observe(node) { observed.push(node); }
    unobserve(node) { unobserved.push(node); }
    disconnect() { this.disconnected = true; }
  } : undefined };
  const document = { addEventListener: (_, fn) => { ready = fn; }, querySelectorAll: selector => selector === '[data-aos] img' ? [] : nodes };
  vm.runInNewContext(fs.readFileSync('js/animations.js', 'utf8'), { document, window, Element });
  ready();
  return { observer, aosCalls, preference, calls, observed, unobserved, heading, paragraph, image, links, caption, nodes,
    change: () => preferenceChange?.(), enter: (...targets) => {
      for (const target of targets) observer.callback([{ target, isIntersecting: true }]);
    } };
}

test('reduced motion and unsupported observers leave content untouched', () => {
  for (const options of [{ reduced: true }, { supported: false }]) {
    const f = fixture(options);
    assert.equal(f.observer, undefined);
    assert.equal(f.calls.length, 0);
  }
});

test('existing motion and live messages are excluded; nested links receive no duplicate effect', () => {
  const f = fixture();
  assert.deepEqual(f.observed, [f.heading, f.paragraph, f.links, f.caption]);
  f.observer.callback([{ target: f.heading, isIntersecting: false }]);
  assert.equal(f.calls.length, 0);
});

test('visible content forms the page opening, with remaining content observed for scrolling', () => {
  const f = fixture({ opening: true });
  assert.deepEqual(f.calls.map(c => c.target), [f.heading, f.paragraph]);
  assert.deepEqual(f.observed, [f.links, f.caption]);
  f.enter(f.heading);
  assert.equal(f.calls.length, 2, 'opening effects are not repeated by the observer');
});

test('image boxes are excluded from the custom animations', () => {
  const f = fixture();
  assert(!f.observed.includes(f.image));
  f.enter(f.heading, f.paragraph, f.links, f.caption);
  assert.deepEqual(f.calls.map(c => c.timing.delay), [0, 70, 140, 0]);
  assert.equal(f.calls[2].frames[0].transform, 'translateY(0)');
});

test('reduced motion cancels only active reveals and stops observation', async () => {
  const f = fixture();
  f.enter(f.heading, f.paragraph);
  f.calls[0].animation.finish();
  await Promise.resolve();
  f.preference.matches = true;
  f.change();
  await Promise.resolve();
  assert(f.observer.disconnected);
  assert(!f.calls[0].animation.cancelled);
  assert(f.calls[1].animation.cancelled);
  f.enter(f.paragraph);
  assert.equal(f.calls.length, 2);
});

test('AOS initializes once with consistent timing, once-only playback and reduced motion', () => {
  const f = fixture();
  assert.equal(f.aosCalls.length, 1);
  const options = f.aosCalls[0];
  assert.equal(options.duration, 700);
  assert.equal(options.once, true);
  assert.equal(options.offset, 80);
  assert.equal(options.disable(), false);
  f.preference.matches = true;
  assert.equal(options.disable(), true);
});

test('every public-page content image belongs to exactly one AOS image box', () => {
  for (const file of fs.readdirSync('.').filter(name => name.endsWith('.html'))) {
    const html = fs.readFileSync(file, 'utf8');
    const stack = [];
    let images = 0, boxes = 0;
    for (const match of html.matchAll(/<\/?([a-z][\w-]*)\b[^>]*>/gi)) {
      const tag = match[1].toLowerCase(), raw = match[0];
      if (raw.startsWith('</')) {
        const index = stack.map(node => node.tag).lastIndexOf(tag);
        if (index >= 0) stack.length = index;
        continue;
      }
      const aos = raw.includes('data-aos="zoom-in-up"');
      if (aos) boxes++;
      if (tag === 'img' && stack.some(node => node.tag === 'main')) {
        images++;
        assert.equal(stack.filter(node => node.aos).length, 1, `${file}: ${raw}`);
      }
      if (!['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'].includes(tag)) stack.push({ tag, aos });
    }
    assert.equal(boxes, images, `${file}: only image boxes use AOS`);
    assert.equal((html.match(/src="js\/vendor\/aos.js"/g) || []).length, 1);
    assert.equal((html.match(/href="css\/vendor\/aos.css"/g) || []).length, 1);
  }
});

test('local AOS includes its built-in zoom-in-up transform without a normal-motion override', () => {
  const css = fs.readFileSync('css/vendor/aos.css', 'utf8');
  assert.match(css, /\[data-aos=zoom-in-up\]\{transform:translate3d\(0,100px,0\) scale\(\.6\)\}/);
  assert.match(css, /transform:translateZ\(0\) scale\(1\)/);
  const custom = fs.readFileSync('css/animations.css', 'utf8');
  assert(!custom.includes(':not(.aos-init)'));
  assert.equal((fs.readFileSync('js/animations.js', 'utf8').match(/AOS\?\.init\(/g) || []).length, 1);
});


test('linked headings keep their upward entrance without animating nested links twice', () => {
  const f = fixture();
  f.heading.interactive = true;
  f.enter(f.heading);
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].frames[0].transform, 'translateY(12px)');
  assert.equal(f.calls[0].timing.duration, 720);
});
