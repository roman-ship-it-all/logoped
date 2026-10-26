# Handoff verification — 2026-10-26

## Performed on this deliverable

- PASS: 60 unique JSON word IDs, every referenced SVG exists, 60 matching PNG exports decoded with Pillow at 256×256 and transparent/opaque pixels present.
- PASS: all 81 SVG production files rendered with Sharp/libvips, dimensions matched the manifest, transparent assets had transparent outer edges and visible opaque content. No drawing was clipped at its canvas boundary in this pixel check.
- PASS: the visual skill's validate_bundle.py accepted all declared paths and dimensions. Raw output is in asset-validation.txt. That validator alone does not establish visual or animation quality.
- PASS: all five JSON data/configuration files parsed. Planned audio files are absent and all 60 statuses correctly remain not-recorded.
- PASS: all seven static design sheets rendered to PNG. Vocabulary sheet, mobile/desktop gameplay, welcome, selection, completion and style board were visually inspected. Desktop title overlap was corrected; selected cards now have visible checkmarks as well as color borders.
- PASS: native SVG source art has no bundled raster/emoji dependency. PNG exports are compatibility files; SVG remains the editable source.
- PASS: archive CRC and required file inventory checked during packaging.

## Deliberately not claimed

No playable game, browser interaction or animation was implemented in this handoff. Therefore game-loop, keyboard, real-device responsiveness, audio races, localStorage behavior and browser compatibility remain the implementing developer's acceptance work. Screen PNG dimensions are not browser responsiveness tests. The SVG poses and flower stages are static assets; no animation playback is claimed.

No native-speaker recordings, clinical review or pilot with children was performed. Picture recognizability is an editorial visual assessment, not a measured developmental result. Generic family roles, gesture/body-part distinctions and symbolic drink images still require adult explanation. The seven screen previews illustrate the intended layout; gameplay previews show the future ready-recording state, while the supplied data must initially run in adult-led mode.

## Rebuild notes

Python 3 standard library regenerates all SVGs and content via tools/build_assets.py and tools/build_previews.py. The latter imports the former, so it also rebuilds core assets. PNG rendering uses tools/render_exports.js and Sharp as a build-time utility only. Sharp is not bundled and is not a game runtime dependency. System font rendering can differ slightly on other systems. Keep the delivered vector sources when no renderer is installed.
