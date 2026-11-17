# Momz14 hosting

Publish the seven root HTML pages, `css/`, `js/`, `images/`, `robots.txt`, `sitemap.xml`, and any recordings you choose to release in `audio/` with `server.js`, `package.json`, `package-lock.json` and the server-only `js/email.js` configuration to a Node.js-capable host. `index.html` is the homepage. Preserve the relative paths and filename case. No frontend build is required. Install the server dependencies with `npm ci`.

The site uses HTML5, CSS3, vanilla JavaScript, Bootstrap 5 and Bootstrap Icons. Existing fonts, Bootstrap and Icons are loaded from their existing CDN URLs. Keep internet access available for these resources.

## Recordings

No MP3 or WAV recordings were supplied with this project. The existing clearly labeled ambient synthesis preview remains available.

To publish a recording:

1. Place the release-ready MP3 or WAV file in `audio/` (create the directory when adding a file).
2. Set `data-audio-src` on its `.music-track-row` in `music.html`, for example:

   ```html
   data-audio-src="audio/genesis.mp3"
   ```

3. For the homepage featured player, set that same path on `.music-player-panel` in `index.html`.
4. Deploy the audio file with the edited HTML. The first catalog row is initially selected on the Music page.

MP3 and browser-supported WAV encoding play through the hidden HTML `<audio id="momzAudio">` element using the existing visible play/pause, seek and volume controls. Actual media metadata sets the duration. Names, descriptions and artwork remain in the HTML; no generated music catalog is involved. `data-track-duration` provides the existing preview length before a recording loads.

For WAV, use a browser-supported encoding such as PCM. The host should serve `.mp3` as `audio/mpeg` and `.wav` as `audio/wav`, with byte-range support for reliable seeking. Test the release in the target browsers. Files in a static publication are public; publish release-ready audio rather than private working material.

## Contact — Node.js and Gmail SMTP

Both existing forms POST JSON to `/contact` on the same origin. `server.js` validates the four required fields, checks the request origin and hidden spam trap, limits attempts to five per IP per 15 minutes, and prevents simultaneous/repeated identical submissions for ten minutes. Rate limits and duplicate tracking are in memory and reset when the process restarts; use shared storage before running multiple instances. No PHP is used.

The server imports `js/email.js` privately. It is **not** a browser script and must not be added to HTML. Gmail uses `smtp.gmail.com:587`, STARTTLS required, authentication and normal TLS certificate verification. The sender and recipient are the `from` and `to` values configured in `js/email.js`. Changing the SMTP sender does not require changing `to`; use the intended inquiry destination there. Reply-To uses the visitor's validated address. The email includes all four form fields and a UTC timestamp.

### Run on your Mac

Use Node.js 22 or newer. From the project directory:

```zsh
npm ci
read -rs 'MOMZ14_SMTP_PASSWORD?New Gmail App Password: '
echo
export MOMZ14_SMTP_PASSWORD
npm start
```

Use a newly generated Gmail App Password for the sender in `js/email.js`, without the display spaces. Revoke the password previously placed in that file. Do not put real passwords in source code or chat. The password is read from the server environment or the Git-ignored `.env` file, which is loaded automatically at startup. Existing exported environment variables take precedence. The `.env` file should contain `MOMZ14_SMTP_PASSWORD=your-new-app-password` and have permissions `600`; never commit or publicly serve it. Gmail App Passwords require 2-Step Verification and an account policy that permits them.

Open `http://localhost:3000/index.html` and `http://localhost:3000/contact.html`. Do not use `file://` or a static-only preview for form submissions. After changing `js/email.js`, `.env` or exported variables, stop the old process with Ctrl+C and run `npm start` again. Refreshing the browser alone does not reload server configuration. The website will still load without SMTP credentials, but sending returns the existing generic error and logs the missing configuration privately in the server terminal. Restart the server after changing environment variables. Set `PORT` if another port is needed.

For each form, submit a unique test inquiry, check the success message and verify actual receipt at the `to` address configured in `js/email.js`, including spam/junk. Confirm all fields, UTC timestamp and Reply-To. SMTP acceptance does not guarantee inbox delivery. Failed submissions retain entered values and can be retried.

SMTP failures are logged in the server terminal with credential redaction; internal errors and passwords are never returned to visitors. `EAUTH` or SMTP 535 means check the sender and its new App Password; timeouts mean check firewall/VPN and outbound access to port 587. Do not disable TLS verification to work around certificate errors. No real Gmail delivery has been verified without configured credentials.

### Deployment

Run `npm ci --omit=dev` and `npm start` on a Node-capable host. Configure `MOMZ14_SMTP_PASSWORD` as a private hosting environment variable and enable HTTPS. Both pages and `/contact` must use the same origin. The server serves only public pages/assets and blocks `js/email.js`, environment files, package files, dependencies and server code. Do not separately publish the whole source folder to a static server. If using a reverse proxy, preserve the public Host header and configure rate limiting at the proxy as well; the server does not trust client-supplied forwarding headers.

GitHub Pages alone cannot run this backend. The fallback direct email links remain available, including without JavaScript. No PHP or separate email service is needed.

## Preview and checks

Open `index.html` or `docs/preview.html` in a browser. The review launcher has all seven pages and the eight existing width controls. Use `npm start` for contact-form testing. Static previews remain sufficient for media and visual checks.

Run the JavaScript checks with:

```sh
node --check js/main.js
npm test
```

Node.js is required for automatic contact-form sending. `docs/` and `tests/` are maintenance material. The SMTP configuration is server-only; never publish passwords with static assets.
