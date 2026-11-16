const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function fixture({ reduced = false, supported = true, opening = false } = {}) {
  const group = { parentElement: null }, calls = [], observed = [], unobserved = [];
  let observer, ready, preferenceChange;
  const preference = { matches: reduced, addEventListener: (_, fn) => { preferenceChange = fn; } };
  class Element {
    constructor(tagName, options = {}) { Object.assign(this, { tagName, group, parentElement: group }, options); }
    closest(selector) { return selector === 'section, footer, header' ? this.group : this.excluded ? {} : null; }
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
  const nodes = [heading, paragraph, image, links, caption, nestedLink, protectedText, emptyIcon];
  const window = { innerHeight: 1000, matchMedia: () => preference, IntersectionObserver: supported ? class {
    constructor(callback, options) { observer = this; this.callback = callback; this.options = options; }
    observe(node) { observed.push(node); }
    unobserve(node) { unobserved.push(node); }
    disconnect() { this.disconnected = true; }
  } : undefined };
  const document = { addEventListener: (_, fn) => { ready = fn; }, querySelectorAll: () => nodes };
  vm.runInNewContext(fs.readFileSync('js/animations.js', 'utf8'), { document, window, Element });
  ready();
  return { observer, preference, calls, observed, unobserved, heading, paragraph, image, links, caption, nodes,
    change: () => preferenceChange?.(), enter: (...targets) => observer.callback(targets.map(target => ({ target, isIntersecting: true }))) };
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
  assert.deepEqual(f.observed, [f.heading, f.paragraph, f.image, f.links, f.caption]);
  f.observer.callback([{ target: f.heading, isIntersecting: false }]);
  assert.equal(f.calls.length, 0);
});

test('visible content forms the page opening, with remaining content observed for scrolling', () => {
  const f = fixture({ opening: true });
  assert.deepEqual(f.calls.map(c => c.target), [f.heading, f.paragraph, f.image]);
  assert.deepEqual(f.observed, [f.links, f.caption]);
  f.enter(f.heading, f.image);
  assert.equal(f.calls.length, 3, 'opening effects are not repeated by the observer');
});

test('one-time reveals stagger text, zoom images gently and preserve stationary controls', () => {
  const f = fixture();
  f.enter(f.heading, f.paragraph, f.image, f.links, f.caption);
  f.enter(f.heading);
  assert.equal(f.calls.length, 5);
  assert.deepEqual(f.calls.map(c => c.timing.delay), [0, 70, 140, 0, 70]);
  assert(f.calls.every(c => c.frames[0].opacity >= .6 && c.frames[1].opacity === 1 && c.timing.duration <= 820));
  assert.equal(f.calls[2].frames[0].transform, 'scale(.975)');
  assert.equal(f.calls[2].frames[1].transform, 'scale(1)');
  assert.equal(f.calls[3].frames[0].transform, 'translateY(0)');
  assert.equal(f.calls[3].frames[0].opacity, .85);
  assert.equal(f.calls[4].frames[0].transform, 'translateY(12px)', 'captions reveal independently without scaling');
});

test('reduced motion cancels only active reveals and stops observation', async () => {
  const f = fixture();
  f.enter(f.heading, f.image);
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
