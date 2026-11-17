const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const createApp = require('../server');
const config = require('../js/email');

async function fixture(t, sendMail) {
  config.auth.pass = 'TEST_ONLY_APP_PASSWORD';
  const messages = [];
  const server = createApp({ sendMail: sendMail || (async message => { messages.push(message); return { accepted: [config.to] }; }) }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, messages, post: (fields, options = {}) => fetch(`${base}/contact`, {
    method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json', ...options.headers },
    body: JSON.stringify(fields), ...options
  }) };
}
const fields = { name: 'Artist Name', email: 'visitor@example.com', subject: 'Booking inquiry', message: 'Line one\nLine two: café' };

test('both pages connect to the same endpoint; complete email data uses the configured sender and recipient', async t => {
  const f = await fixture(t);
  for (const page of ['index.html', 'contact.html']) {
    const html = await (await fetch(`${f.base}/${page}`)).text();
    assert.match(html, /action="\/contact" method="post"/);
    assert(!html.includes('src="js/email.js"'));
    const response = await f.post({ ...fields, subject: page });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).message, 'Thank you. Your message has been submitted successfully.');
    const mail = f.messages.at(-1);
    assert.equal(mail.from, config.from); assert.equal(mail.to, config.to);
    assert.equal(mail.replyTo, fields.email);
    for (const value of Object.values({ ...fields, subject: page })) assert(mail.text.includes(value));
    assert.match(mail.text, /Submitted at: \d{4}-\d\d-\d\dT/);
  }
  assert.equal(config.host, 'smtp.gmail.com'); assert.equal(config.port, 587);
  assert.equal(config.secure, false); assert.equal(config.requireTLS, true);
});

test('SMTP configuration, dependencies, environment files and server code are never served', async t => {
  const f = await fixture(t);
  for (const url of ['/js/email.js', '/js/%65mail.js', '/server.js', '/package.json', '/package-lock.json', '/.env', '/node_modules/nodemailer/package.json', '/tests/contact-node.test.cjs']) {
    assert.equal((await fetch(f.base + url)).status, 404, url);
  }
  for (const url of ['/', '/about.html', '/js/main.js', '/js/animations.js', '/js/vendor/aos.js', '/css/style.css', '/images/new-logo.png']) assert.equal((await fetch(f.base + url)).status, 200, url);
});

test('cross-origin posts, missing fields, bad email, header injection and spam are rejected before sending', async t => {
  const f = await fixture(t);
  assert.equal((await f.post(fields, { headers: { Origin: 'https://other.example', 'Content-Type': 'application/json' } })).status, 403);
  assert.equal((await f.post(fields, { headers: { 'Content-Type': 'application/json' } })).status, 403);
  for (const value of [{ ...fields, name: '' }, { ...fields, name: [] }, { ...fields, email: 'not-email' }, { ...fields, email: 'first,second@example.com' }, { ...fields, email: 'name@-invalid.example' }, { ...fields, email: 'x@example.com\r\nBcc: evil@example.com' }, { ...fields, message: ' ' }, { ...fields, contact_reference: 'spam' }, { ...fields, subject: 'a'.repeat(256) }]) assert.equal((await f.post(value)).status, 422);
  assert.equal((await f.post(fields, { body: '{' })).status, 400);
  assert.equal((await f.post({ ...fields, message: 'x'.repeat(40000) })).status, 413);
  assert.equal(f.messages.length, 0);
});

test('simultaneous and repeated submissions send only one message', async t => {
  let release, started;
  const sending = new Promise(resolve => { started = resolve; });
  const waiting = new Promise(resolve => { release = resolve; });
  let count = 0;
  const f = await fixture(t, async () => { count++; started(); await waiting; return { accepted: [config.to] }; });
  const first = f.post(fields); await sending;
  assert.equal((await f.post(fields)).status, 409);
  release(); assert.equal((await first).status, 200);
  const duplicate = await f.post(fields); assert.equal(duplicate.status, 200);
  assert.match((await duplicate.json()).message, /already been submitted/); assert.equal(count, 1);
});

test('SMTP failures keep diagnostics private, redact credentials and allow retry', async t => {
  let failing = true;
  const logs = [];
  t.mock.method(console, 'error', (...args) => logs.push(args.join(' ')));
  const f = await fixture(t, async () => {
    if (failing) throw Object.assign(new Error(`535 authentication rejected ${config.auth.pass}`), { code: 'EAUTH', responseCode: 535 });
    return { accepted: [config.to] };
  });
  const response = await f.post(fields); assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { ok: false, message: 'Your message could not be sent. Please try again later.' });
  assert(logs[0].includes('EAUTH') && logs[0].includes('535'));
  assert(!logs[0].includes(config.auth.pass) && !logs[0].includes(fields.email));
  failing = false; assert.equal((await f.post(fields)).status, 200);
});

test('missing credentials fail safely and per-IP rate limits stop excess sends', async t => {
  const f = await fixture(t);
  t.mock.method(console, 'error', () => {});
  config.auth.pass = 'DUMMY_APP_PASSWORD'; assert.equal((await f.post(fields)).status, 503);
  assert.equal(f.messages.length, 0); config.auth.pass = 'TEST_ONLY_APP_PASSWORD';
  for (let i = 0; i < 4; i++) assert.equal((await f.post({ ...fields, subject: `rate ${i}` })).status, 200);
  const limited = await f.post({ ...fields, subject: 'rate exceeded' });
  assert.equal(limited.status, 429); assert(Number(limited.headers.get('retry-after')) > 0);
});


test('the hidden spam field avoids generic website autofill while filled traps are still rejected', async t => {
  const f = await fixture(t);
  for (const page of ['index.html', 'contact.html']) {
    const html = await (await fetch(`${f.base}/${page}`)).text();
    assert.match(html, /<input[^>]*name="contact_reference"[^>]* hidden>/);
    assert(!html.includes('name="website"'));
    const valid = await f.post({ ...fields, subject: page, contact_reference: '' });
    assert.equal(valid.status, 200);
    const spam = await f.post({ ...fields, subject: page + ' spam', contact_reference: 'filled by a bot' });
    assert.equal(spam.status, 422);
    assert.equal((await spam.json()).message, 'The form could not be accepted. Please try again.');
  }
  assert.equal(f.messages.length, 2);
});
