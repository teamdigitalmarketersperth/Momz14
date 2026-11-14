# MOMZ14 static conversion report

## Result

The site is now a static HTML5/CSS3/vanilla JavaScript site using the existing Bootstrap 5 and Bootstrap Icons resources. All six pages are retained. No build system or application runtime dependency was added.

The complete project was inventoried before removal, including hidden files, source references, deployment instructions, old tests and generated graph artifacts. Graphify was used to locate the former music/contact connections, and the actual current source confirmed the dependencies. The old generated graph was then removed because it retained obsolete system references; the user-level Graphify skill itself was not modified.

## Design and content preservation

- Both shared stylesheets are byte-for-byte unchanged.
- All original image files are byte-for-byte unchanged; no client media deleted or replaced.
- About, Studio and Events HTML and sitemap.xml are byte-for-byte unchanged.
- Home and Music retain the same layout, artwork, controls, metadata and catalog. Added a hidden HTML audio element and empty `data-audio-src` attributes. Format/status text describes MP3/WAV playback rather than a conversion pipeline. Existing artist text, quotations and track titles remain.
- Contact retains the same photographs, layout, fields, validation and button styling. Its action now opens an email draft; the button and instructions accurately describe that behavior. A hidden spam trap was removed. No message is claimed delivered.
- Navigation, responsive CSS, wide transparent logo and shared background implementation remain intact.
- No media recordings were found to migrate. No remote data store was accessed or deleted.

## Static audio

The Music page and featured Home player use `<audio id="momzAudio">` with the existing visible controls. To use a release-ready local recording, put it in `audio/` and set `data-audio-src="audio/filename.mp3"` or `data-audio-src="audio/filename.wav"` on its catalog row. Set the Home player panel's attribute for the featured recording. See [hosting instructions](../HOSTING-CONFIG.md).

Play/pause, metadata duration, seeking, volume, track selection, end-of-track reset and error handling are retained. The existing explicitly labeled ambient synthesis preview still works when no recording is assigned. An assigned but unavailable recording shows an error instead of substituting the preview. There is no permanent file submission or dashboard-based music management.

## Contact

The form validates locally and creates a percent-encoded `mailto:` draft to `booking@momz14.com`. Visitors review and send it in their email app. Text remains in the page, and the direct email link is available as a fallback. A configured email handler is needed to open the draft; the site itself does not deliver or store messages.

## Files removed

The following list is the audit of deleted paths, not active configuration or links. It intentionally names the removed technologies/files. All executable PHP, MySQL schema, API endpoints, admin authentication/dashboard/upload/processing code and their supporting assets were removed from the project.

| Former directory | Files removed |
|---|---:|
| admin/ | 11 |
| api/ | 6 |
| database/ | 1 |
| graphify-out/ | 50 |
| tests/ | 1 |
| uploads/ | 1 |

Complete removal list (70 files):

```text
admin/auth.php
admin/css/admin.css
admin/dashboard.php
admin/events.php
admin/index.php
admin/js/admin.js
admin/logout.php
admin/music-add.php
admin/music-edit.php
admin/music.php
admin/studio.php
api/config.php
api/contact.php
api/db.php
api/events.php
api/music.php
api/studio.php
database/schema.sql
graphify-out/.graphify_labels.json
graphify-out/.graphify_learning.json
graphify-out/.graphify_python
graphify-out/.graphify_root
graphify-out/.graphify_uncached.txt
graphify-out/.needs_update
graphify-out/GRAPH_REPORT.md
graphify-out/cache/ast/v0.9.108-s45-g460503b3f2a4/185d1203871ff3e692671b330d1b5837f64a731de0c099379341b814cfb6143b.json
graphify-out/cache/ast/v0.9.108-s45-g460503b3f2a4/1f600e840cb56412f7b7d7a82a9a253c2ed8982563cca33e7912d47fdb6de1c1.json
graphify-out/cache/ast/v0.9.108-s45-g460503b3f2a4/273748a45b3227da2065c4226a629053845e0cd21987c68bce2fa71878a3a470.json
graphify-out/cache/ast/v0.9.108-s45-g460503b3f2a4/2b3eb0f0f4f99488a6edacac59e85adc46874bfbb8d358bdb4f90db9fb50f63c.json
graphify-out/cache/ast/v0.9.108-s45-g460503b3f2a4/390c6896943c1adcf1ae34eebfe7c7620c7177131dee1495dad0bb8cbc454f9a.json
graphify-out/cache/ast/v0.9.108-s45-g460503b3f2a4/5e2792bd2d75cbf0e5cae88f0e8a3b917c8c8af809b45e0657f0e1a1465a1796.json
graphify-out/cache/ast/v0.9.108-s45-g460503b3f2a4/66918526bfa91f396b8cb2245ea59392bdaf7a0de7e7a5a2eb99e8c0b9da7627.json
graphify-out/cache/ast/v0.9.108-s45-g460503b3f2a4/677f27bf5719064e674d32c6cc783f48821fc6525a918ad9795a9c08899532ad.json
graphify-out/cache/ast/v0.9.108-s45-g460503b3f2a4/6c36ec12c5dc14359777f9cbeb451bc4049eb082794ce930165a14413d1b8ab4.json
graphify-out/cache/ast/v0.9.108-s45-g460503b3f2a4/78b7064b32358751b4b17c616134770369dda205fd9718ffc0f5ae4ef3b3cb7b.json
graphify-out/cache/ast/v0.9.108-s45-g460503b3f2a4/87ae93d9fdbe40ba09f85bf85fee7829406b265e03c9747debe2ba6b87d6eb15.json
graphify-out/cache/ast/v0.9.108-s45-g460503b3f2a4/a29827dc3fca173b2b16c49b8fb39e094e651f8241faf300d7b094f0cae53bd2.json
graphify-out/cache/ast/v0.9.108-s45-g460503b3f2a4/b32c391714a48dfabd2b4f278c10492fb83becb43e2674a35eb9596cd92e636e.json
graphify-out/cache/ast/v0.9.108-s45-g460503b3f2a4/c370daca3d48d100f9a3a38fd1134547ed86475c1baf8428d1d321ce495a8ab0.json
graphify-out/cache/ast/v0.9.108-s45-g460503b3f2a4/c6ef3f236609e80e04a8751661712e0949332bc831774c8fcf63bbc4ee2810f7.json
graphify-out/cache/last_query_stamp
graphify-out/cache/semantic/pd203674c4804/155703a7932d6448496d05d2287a913168cfce7fba8b6f3ec710eb221b53df3b.json
graphify-out/cache/semantic/pd203674c4804/20e3a03fba4859371b9ccbd8b1801183c686bd91196dc0f6a006179431dfbf79.json
graphify-out/cache/semantic/pd203674c4804/4f562b3840f1798921924aece8278e9466bc89de3f4374237a7bb5a1d17b0111.json
graphify-out/cache/semantic/pd203674c4804/59b9daf388455e2bdc943be01f24382221b2d9a296085bc1a2b5b05eb97978db.json
graphify-out/cache/semantic/pd203674c4804/60109be1e313c6d2140cb46ce3f32656d346a2ddb8e2357084747a8940b0d33d.json
graphify-out/cache/semantic/pd203674c4804/61179a3fa2d984f6f6e247b86535d87233fe6b596e86b1007227150d3700651b.json
graphify-out/cache/semantic/pd203674c4804/732ac7349ae6549d54edc35a85deb1808b746daf57e1e635c5e2c0a5edfd2615.json
graphify-out/cache/semantic/pd203674c4804/7a3699146b9feaae4e1b3f26a1e6271d59974e1fbda6f050e8de7ca6a9d28419.json
graphify-out/cache/semantic/pd203674c4804/820371ba64773a3c9005b7c9fc4a30f7cc5c5e6d5c06799e69fa2eead0d6b7b9.json
graphify-out/cache/semantic/pd203674c4804/8c26628d0b71a6b07b904ecadf279d8affd56b5d1a6ee7cbf9d820f82e756d15.json
graphify-out/cache/semantic/pd203674c4804/937d1e427c567762e2a0d07a02837589645dce4c844f1d1c6fe49e2f1512d572.json
graphify-out/cache/semantic/pd203674c4804/a2d59e6f1290a2ec6aee104021781a79ea97dd91da15161ca8e80c42f8a3198e.json
graphify-out/cache/semantic/pd203674c4804/aa9e49ba6bd228d32c2c56e4ccd8d698478dc5e52be0b122c1914ac3ae5488b7.json
graphify-out/cache/semantic/pd203674c4804/be763015f1abb886f8c7d2b4b73ee1727fecfe42c760efad3bb9315c531cc40d.json
graphify-out/cache/semantic/pd203674c4804/c1353818f150fb8a75506b9fc4ddb03c042b50f6613b46a7a3c923e4bcf828fb.json
graphify-out/cache/semantic/pd203674c4804/c90e78ab13f8172f2a3e0a0f0d852ebb411d588e9bd45c595c39300525aa04c7.json
graphify-out/cache/semantic/pd203674c4804/d762b52128d81ef4124eddf3f4509d84f222cf7de7a25fabd1ca8cd295d1965c.json
graphify-out/cache/semantic/pd203674c4804/dced7aa12ca87ef0b33d02c598c2055ced4392595960f83a81ee1752ab0e1971.json
graphify-out/cache/semantic/pd203674c4804/e92180e1341b002ba093c8293d8e594515c632de23d7585f5ddefba6fa98c9b5.json
graphify-out/cache/semantic/pd203674c4804/f35c9d2d82f7bed3b332fdca2e17a7cc7745a7aac194898a58a32175060cc70b.json
graphify-out/cache/stat-index.json
graphify-out/cost.json
graphify-out/graph.html
graphify-out/graph.json
graphify-out/manifest.json
graphify-out/memory/query_20261114_051312_cc001aea_which_frontend_paths_need_protection_during_the_mo.md
graphify-out/reflections/LESSONS.md
tests/check_site.py
uploads/wav/.htaccess
```

## Documentation and cleanup

- Rewrote HOSTING-CONFIG.md and BACKUP-RECOVERY.md for static files and local recordings.
- Replaced obsolete delivery/database assertions in docs/VERIFICATION.md and retained the original asset inventory in docs/FRONTEND-REFINEMENT.md.
- Removed obsolete generated graph, extraction caches, manifests and query memory containing old system references.
- Removed the old Python integrity checker; checks now use only JavaScript and Node's standard library for development.
- Updated robots.txt and review-launcher guidance. Removed remote catalog synchronization and form POST requests from the public script.
- No composer/package manifest, environment file or additional runtime dependency was present.
- A recovery archive of removed files and superseded operational docs exists outside the project at `/tmp/momz14-static-baseline/removed-system.tar.gz`. It is not part of the static website or deployment.

## Verification performed

- `node --check js/main.js`: passed.
- `node --test tests/*.test.cjs`: 18 passed, 0 failed. Nine interaction checks and nine static integrity checks, including a separate integrity check for each of the six pages.
- HTML5 parsing with the already-installed parse5 tool: all six pages and the review launcher passed. No new dependency was added to the project.
- All local links, image references, logo dimensions, section fragments, labels, headings and shared stylesheet references checked for every page.
- Local MP3 and WAV source selection, file-preview relative paths, track selection, metadata duration, seek, volume, pause, ended/error states and retained synthesis preview verified using DOM/audio fixtures.
- Contact draft encoding, text retention, honest status text and invalid/whitespace input handling verified using fixtures.
- Mobile drawer focus, inert state and Escape behavior verified using fixtures.
- The deployed source has no data requests, form POST, server endpoints, login code or automatic content synchronization. Static tests assert removed directories/executable files are absent.
- SHA-256 comparison against the pre-conversion inventory: all 18 protected files unchanged (the complete image directory including its metadata file, both stylesheets, About/Studio/Events HTML and sitemap).

## Verification limits

Chrome/Playwright was attempted again and failed to launch in this sandbox. Therefore rendered viewport checks, screenshots, actual browser-console inspection and audible playback are not claimed. Existing responsive CSS is unchanged, but the eight viewport sizes were not rerun in a browser. No client MP3/WAV files were supplied, so audio contract tests use fixtures rather than a real client recording. Email-draft behavior still depends on the visitor's mail app. Existing CDN fonts/styles/icons require internet access.

Open [the six-page review launcher](preview.html) or [the homepage](../index.html) to review the updated static site. No deployment was performed.
