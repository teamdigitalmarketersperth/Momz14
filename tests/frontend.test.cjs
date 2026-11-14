/* Run: node --test tests/*.test.cjs. DOM/audio fixtures; no browser required. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

class Element {
  constructor() {
    this.attributes = {}; this.listeners = {}; this.dataset = {}; this.children = [];
    this.style = {}; this.value = ''; this.textContent = ''; this.className = '';
    const classes = new Set();
    this.classList = { contains: c => classes.has(c), toggle: (c, on) => on ? classes.add(c) : classes.delete(c) };
  }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k]; }
  removeAttribute(k) { delete this.attributes[k]; }
  addEventListener(type, callback) { (this.listeners[type] ??= []).push(callback); }
  async emit(type, extra = {}) {
    await Promise.all((this.listeners[type] || []).map(callback => callback({ target: this, preventDefault() {}, ...extra })));
  }
  querySelectorAll(selector) { return this.all?.[selector] || []; }
  querySelector(selector) { return this.one?.[selector] || null; }
  closest(selector) { return this.parents?.[selector] || null; }
  focus() { this.focused = true; }
}

async function fixture({ tracks = [], source = '', contact = false, invalid = false, noPlayer = false, href = 'https://momz14.test/music.html' } = {}) {
  const ids = {};
  for (const id of ['audioPlayBtn','playIcon','audioProgressWrap','audioCurrentTime','audioTotalTime','audioVolume','playerStatus','formSuccessAlert','formErrorAlert']) ids[id] = new Element();
  ids.audioVolume.value = '.8';
  if (noPlayer) delete ids.audioPlayBtn;
  const header = new Element(), drawer = new Element(), toggle = new Element(), close = new Element(), main = new Element(), footer = new Element();
  const first = new Element(), last = new Element();
  drawer.all = { a: [first, last], 'a, button': [first, close, last] };
  const title = new Element(), description = new Element(), meta = new Element(), catalog = new Element(), panel = new Element();
  panel.dataset.audioSrc = source;
  const rows = tracks.map(track => {
    const row = new Element(), button = new Element(), caption = new Element();
    row.dataset = { trackTitle: track.title, trackDuration: track.duration || '214', audioSrc: track.source || '' };
    caption.textContent = track.description || 'Original composition'; row.one = { span: caption };
    button.parents = { '.track-row-play-btn': button, '.music-track-row': row };
    row.button = button;
    return row;
  });
  catalog.all = { '.music-track-row': rows }; catalog.one = { '.music-track-row': rows[0] };
  const elements = { '.site-header': header, '.mobile-drawer': drawer, '.mobile-nav-toggle': toggle, '.mobile-drawer-close': close, main, footer, '.current-track-title': title, '.track-description': description, '.current-track-meta': meta, '.music-catalog-table': catalog, '.music-player-panel': panel };
  const document = { body: new Element(), activeElement: null, getElementById: id => ids[id] || null,
    querySelector: selector => elements[selector] || null, addEventListener(type, cb) { if (type === 'DOMContentLoaded') this.ready = cb; } };
  let form, fields;
  if (contact) {
    form = ids.momzContactForm = new Element();
    fields = ['contactName','contactEmail','contactSubject','contactMessage'].map((id, i) => {
      const input = ids[id] = new Element();
      input.value = ['Artist Name','person@example.test','Festival & commission?','Original inquiry.'][i];
      return input;
    });
    form.all = { '[required]': fields }; form.reportValidity = () => !invalid;
  }
  const intervals = new Map();
  const audio = new Element();
  audio.duration = 62; audio.currentTime = 0;
  audio.play = async () => { if (audio.rejectPlay) throw new Error('Media unavailable'); audio.played = true; };
  audio.pause = () => { audio.paused = true; };
  audio.load = () => {};
  if (!noPlayer) ids.momzAudio = audio;
  class AudioContext {
    constructor() { this.currentTime = 0; }
    createGain() { return { gain: { value: 0, setTargetAtTime() {} }, connect() {} }; }
    createOscillator() { return { frequency: {}, connect() {}, start() {} }; }
    createBiquadFilter() { return { frequency: {}, connect() {} }; }
    async resume() {}
  }
  const location = { href, origin: new URL(href).origin };
  const window = { scrollY: 0, location, AudioContext, addEventListener() {}, matchMedia: () => ({ addEventListener() {} }) };
  vm.runInNewContext(fs.readFileSync('js/main.js', 'utf8'), { document, window, URL, console,
    fetch() { throw new Error('Static site must not request remote data'); },
    setInterval: cb => { intervals.set(1, cb); return 1; }, clearInterval: id => intervals.delete(id) });
  document.ready();
  return { ids, title, description, meta, catalog, rows, drawer, header, main, footer, toggle, close, first, last, document, audio, intervals, form, fields, location };
}

test('MP3 and WAV use the HTML audio element with duration, seek, volume and pause controls', async () => {
  for (const source of ['audio/recording.mp3', 'audio/recording.wav']) {
    const f = await fixture({ source });
    assert.equal(f.audio.src, `https://momz14.test/${source}`);
    await f.ids.audioPlayBtn.emit('click');
    assert.equal(f.audio.played, true);
    assert.equal(f.ids.audioPlayBtn.getAttribute('aria-pressed'), 'true');
    await f.audio.emit('loadedmetadata');
    assert.equal(f.ids.audioTotalTime.textContent, '1:02');
    f.audio.currentTime = 14;
    await f.audio.emit('timeupdate');
    assert.equal(f.ids.audioCurrentTime.textContent, '0:14');
    f.ids.audioProgressWrap.value = '32';
    await f.ids.audioProgressWrap.emit('input');
    assert.equal(f.audio.currentTime, 32);
    f.ids.audioVolume.value = '.25';
    await f.ids.audioVolume.emit('input');
    assert.equal(f.audio.volume, .25);
    await f.ids.audioPlayBtn.emit('click');
    assert.equal(f.audio.paused, true);
    await f.audio.emit('ended');
    assert.equal(f.ids.audioCurrentTime.textContent, '0:00');
    assert.equal(f.ids.audioPlayBtn.getAttribute('aria-pressed'), 'false');
  }
});

test('static catalog selection plays the chosen file and keeps titles as text', async () => {
  const secondTitle = '<img src=x onerror=alert(1)>';
  const f = await fixture({ tracks: [{ title: 'First', source: 'audio/first.mp3' }, { title: secondTitle, source: 'audio/second.wav', description: 'Second track notes' }] });
  assert.equal(f.audio.src, 'https://momz14.test/audio/first.mp3');
  await f.catalog.emit('click', { target: f.rows[1].button });
  assert.equal(f.title.textContent, secondTitle);
  assert.equal(f.description.textContent, 'Second track notes');
  assert.equal(f.audio.src, 'https://momz14.test/audio/second.wav');
  assert.equal(f.rows[1].classList.contains('is-current'), true);
  assert.equal(f.audio.played, true);
});

test('relative WAV paths work from a file preview as well as a static host', async () => {
  const f = await fixture({ href: 'file:///site/music.html', source: 'audio/track.WAV' });
  assert.equal(f.audio.src, 'file:///site/audio/track.WAV');
});

test('unsupported, foreign and script sources never become media sources', async () => {
  for (const source of ['audio/not-audio.html','https://other.test/stream.mp3','javascript:alert(1)']) {
    const f = await fixture({ source });
    assert.equal(f.audio.src, undefined, source);
    assert.match(f.ids.playerStatus.textContent, /Ambient preview/);
  }
});

test('existing ambient preview still works with no recordings supplied', async () => {
  const f = await fixture();
  await f.ids.audioPlayBtn.emit('click');
  assert.match(f.ids.playerStatus.textContent, /Ambient synthesis preview/);
  assert.equal(f.intervals.size, 1);
  f.intervals.get(1)();
  assert.equal(f.ids.audioCurrentTime.textContent, '0:01');
  await f.ids.audioPlayBtn.emit('click');
  assert.equal(f.intervals.size, 0);
});

test('missing recording reports an error without substituting the ambient preview', async () => {
  const f = await fixture({ source: 'audio/missing.mp3' });
  f.audio.rejectPlay = true;
  await f.ids.audioPlayBtn.emit('click');
  assert.match(f.ids.playerStatus.textContent, /could not play/);
  await f.audio.emit('error');
  assert.match(f.ids.playerStatus.textContent, /unavailable/);
  assert.equal(f.ids.audioPlayBtn.getAttribute('aria-pressed'), 'false');
  assert.equal(f.intervals.size, 0);
});

test('drawer keeps semantics, focus trapping and Escape without a music player', async () => {
  const f = await fixture({ noPlayer: true });
  await f.toggle.emit('click');
  assert.equal(f.drawer.getAttribute('aria-hidden'), 'false');
  assert.equal(f.drawer.inert, false);
  assert.equal(f.main.inert, true);
  assert.equal(f.header.inert, true);
  assert.equal(f.close.focused, true);
  f.document.activeElement = f.last;
  let prevented = false;
  await f.drawer.emit('keydown', { key: 'Tab', preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true); assert.equal(f.first.focused, true);
  await f.drawer.emit('keydown', { key: 'Escape' });
  assert.equal(f.drawer.getAttribute('aria-hidden'), 'true');
  assert.equal(f.main.inert, false); assert.equal(f.toggle.focused, true);
});

test('contact composes an encoded email draft, preserves text and never claims delivery', async () => {
  const f = await fixture({ contact: true, noPlayer: true });
  f.fields[3].value = 'Line one & ? #\nLine two: café';
  await f.form.emit('submit');
  const draft = new URL(f.location.href);
  assert.equal(draft.protocol, 'mailto:');
  assert.equal(draft.pathname, 'booking@momz14.com');
  assert.equal(draft.searchParams.get('subject'), 'Festival & commission?');
  assert.match(draft.searchParams.get('body'), /Name: Artist Name\r\nEmail: person@example.test/);
  assert.match(draft.searchParams.get('body'), /Line one & \? #\nLine two: café/);
  assert.equal(f.fields[3].value, 'Line one & ? #\nLine two: café');
  assert.match(f.ids.formSuccessAlert.textContent, /Review it and send it there/);
  assert.doesNotMatch(f.ids.formSuccessAlert.textContent, /has been sent|delivered/i);
});

test('invalid and whitespace-only contact fields do not open drafts', async () => {
  const f = await fixture({ contact: true, noPlayer: true, invalid: true });
  await f.form.emit('submit'); assert.equal(f.location.href, 'https://momz14.test/music.html');
  const g = await fixture({ contact: true, noPlayer: true });
  g.fields[1].value = '   ';
  await g.form.emit('submit'); assert.equal(g.location.href, 'https://momz14.test/music.html');
  assert.equal(g.fields[1].focused, true);
});
