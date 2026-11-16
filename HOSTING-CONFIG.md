# Momz14 static hosting

Publish the six root HTML pages, `css/`, `js/`, `images/`, `robots.txt`, `sitemap.xml`, and any recordings you choose to release in `audio/` to a static host. `index.html` is the homepage. Preserve the relative paths and filename case. No build or package installation is required.

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

## Contact

The Contact form validates its fields and opens a prefilled `mailto:` draft to `booking@momz14.com`. The visitor must review and send that draft in their email app. The page keeps entered text and never claims delivery. A direct email link is available, including without JavaScript.

## Preview and checks

Open `index.html` or `docs/preview.html` in a browser. The review launcher has all six pages and the eight existing width controls. For representative media loading and seeking checks, use a static HTTP preview from your editor or host.

Run the JavaScript checks with:

```sh
node --check js/main.js
node --test tests/*.test.cjs
```

Node is for development checks only and is not required on the static host. Deploy only the public site files; `docs/` and `tests/` are maintenance material.
