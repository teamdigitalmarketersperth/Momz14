# MOMZ14 static site backup and recovery

Back up the six HTML pages, shared `css/` and `js/` directories, original `images/`, `robots.txt`, `sitemap.xml`, and any release-ready recordings in `audio/` before each release. Keep the original client images intact. Store working audio masters separately from the public site.

Restore the matching HTML, styles, scripts and assets from the same release together. Preserve filename case and relative paths. If recordings have been added, include those files at the paths used by `data-audio-src` in the HTML.

After restoring:

1. Open all six pages and follow the desktop and mobile navigation.
2. Check the logo, common background, photography and responsive layouts.
3. Play a supplied recording; check play/pause, seeking, volume and track selection.
4. Check that Contact opens an email draft and preserves entered text.
5. Run `node --test tests/*.test.cjs` for the static integrity and interaction checks.

No content is saved by this website. Content edits and new recordings are made in the local site files and then deployed together.
