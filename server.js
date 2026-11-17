'use strict';

const express = require('express');
const nodemailer = require('nodemailer');
const { createHash } = require('node:crypto');
const path = require('node:path');
const { existsSync } = require('node:fs');
const envFile = path.join(__dirname, '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);
const config = require('./js/email');

const failure = 'Your message could not be sent. Please try again later.';

function createApp(mailer) {
  const { from, to, ...smtp } = config;
  mailer ||= nodemailer.createTransport({ ...smtp, connectionTimeout: 10000, socketTimeout: 20000 });
  const app = express();
  // shortcut: limits and duplicate tracking reset on restart; use shared storage for multiple instances.
  const rates = new Map();
  const submissions = new Map();
  app.disable('x-powered-by');

  app.post('/contact', express.json({ limit: '32kb' }), async (req, res) => {
    res.set('Cache-Control', 'no-store');
    let origin;
    try { origin = new URL(req.get('origin')); } catch { /* Missing origins are rejected below. */ }
    if (!origin || !['http:', 'https:'].includes(origin.protocol) || origin.host !== req.get('host')) {
      return res.status(403).json({ ok: false, message: 'Please submit the form from this website.' });
    }
    if (!req.is('application/json') || !req.body || Array.isArray(req.body)) {
      return res.status(400).json({ ok: false, message: 'Invalid form submission.' });
    }
    if (typeof (req.body.contact_reference ?? '') !== 'string' || (req.body.contact_reference || '').trim()) {
      return res.status(422).json({ ok: false, message: 'The form could not be accepted. Please try again.' });
    }
    const fields = {};
    const limits = { name: 100, email: 254, subject: 255, message: 10000 };
    for (const [key, limit] of Object.entries(limits)) {
      const value = req.body[key];
      if (typeof value !== 'string' || !value.trim() || value.length > limit || /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(value) || (key !== 'message' && /[\r\n]/.test(value))) {
        return res.status(422).json({ ok: false, message: 'Please complete every required field with valid text.' });
      }
      fields[key] = value.trim();
    }
    if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(fields.email)) {
      return res.status(422).json({ ok: false, message: 'Please enter a valid email address.' });
    }
    const now = Date.now();
    for (const [key, value] of rates) if (value.until <= now) rates.delete(key);
    for (const [key, value] of submissions) if (value.until <= now) submissions.delete(key);
    const fingerprint = createHash('sha256').update(JSON.stringify([req.ip, fields])).digest('hex');
    const previous = submissions.get(fingerprint);
    if (previous) {
      return res.status(previous.pending ? 409 : 200).json({ ok: !previous.pending, message: previous.pending ? 'This message is already being submitted.' : 'This message has already been submitted. No duplicate email was sent.' });
    }
    const rate = rates.get(req.ip) || { count: 0, until: now + 15 * 60 * 1000 };
    if (rate.count >= 5) {
      res.set('Retry-After', String(Math.ceil((rate.until - now) / 1000)));
      return res.status(429).json({ ok: false, message: 'Too many submissions. Please wait 15 minutes before trying again.' });
    }
    rates.set(req.ip, { ...rate, count: rate.count + 1 });
    submissions.set(fingerprint, { pending: true, until: now + 10 * 60 * 1000 });
    try {
      if (!config.auth.pass || config.auth.pass === 'DUMMY_APP_PASSWORD') {
        throw Object.assign(new Error('Set MOMZ14_SMTP_PASSWORD to a new Gmail App Password.'), { code: 'SMTP_NOT_CONFIGURED' });
      }
      const text = `Momz14 website contact submission\nSubmitted at: ${new Date().toISOString()}\n\n` + Object.entries(fields).map(([key, value]) => `${key}:\n${value}`).join('\n\n');
      const result = await mailer.sendMail({ from, to, replyTo: fields.email, subject: 'Momz14 website contact inquiry', text });
      if (!result.accepted?.length) throw new Error('SMTP server did not accept the recipient.');
      submissions.set(fingerprint, { pending: false, until: now + 10 * 60 * 1000 });
      return res.json({ ok: true, message: 'Thank you. Your message has been submitted successfully.' });
    } catch (error) {
      submissions.delete(fingerprint);
      let detail = JSON.stringify({ code: error.code, responseCode: error.responseCode, message: error.message });
      for (const secret of [config.auth.user, config.auth.pass]) {
        if (secret) for (const value of [secret, Buffer.from(secret).toString('base64'), JSON.stringify(secret).slice(1, -1)]) detail = detail.split(value).join('[redacted]');
      }
      console.error('Momz14 contact:', detail);
      return res.status(503).json({ ok: false, message: failure });
    }
  });

  // Serve public assets explicitly so SMTP configuration and server files stay private.
  for (const directory of ['css', 'images', 'audio', 'js/vendor']) {
    app.use(`/${directory}`, express.static(path.join(__dirname, directory), { dotfiles: 'deny', index: false }));
  }
  const files = ['index.html', 'about.html', 'music.html', 'studio.html', 'events.html', 'contact.html', 'inspirations.html', 'robots.txt', 'sitemap.xml', 'js/main.js', 'js/animations.js', 'js/music-audio.js'];
  app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
  for (const file of files) app.get(`/${file}`, (req, res) => res.sendFile(path.join(__dirname, file)));
  app.use((error, req, res, next) => {
    if (error.type === 'entity.too.large' || error.type === 'entity.parse.failed') {
      return res.status(error.type === 'entity.too.large' ? 413 : 400).json({ ok: false, message: 'Invalid or oversized form submission.' });
    }
    console.error('Momz14 server error:', error.code || error.name);
    res.status(500).json({ ok: false, message: failure });
  });
  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  createApp().listen(port, () => console.log(`Momz14 running at http://localhost:${port}`));
  if (!config.auth.pass || config.auth.pass === 'DUMMY_APP_PASSWORD') console.warn('Email sending requires MOMZ14_SMTP_PASSWORD; the website will still load.');
}
module.exports = createApp;
