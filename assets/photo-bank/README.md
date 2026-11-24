# Lesson photographs

The original 400 photorealistic AI images cover 80 lesson kinds in each of
Groen, Techniek, Zorg en Welzijn, HBR and Economie. The existing instrument
photos, exact coins and native mathematical figures remain separate.

`priority-audit.json` records the initial review: 69 kinds without a specific
workplace photo have priority 1 (345 sector images); 11 kinds with frequently
reused generic photos have priority 2 (55 images). `manifest.json` maps each
individual file to its kind, sector, short work situation, lesson IDs and weeks.
The subject matter of all five original sector review sheets was visually inspected.

## Measuring, geometry and route expansion

The `meten-ruimte-300` batch adds exactly 300 new, distinct photos: 60 kinds
in each of the five sectors. There are now 700 image assets, 140 per sector.
The original 400 binaries are unchanged; `base-400-integrity.json` records
their original hashes and the photo-bank check verifies every one.

The new prompts in `expansion-jobs.json` specify 25 grids with 3 columns and
4 rows. Every extracted cell is a separately described workplace scene.
The five new sector review sheets were visually checked for the pictured
object, job action and sector. `recovered-sources.json` retains the exact
saved source identities of the last five sheets recovered after interruption.
Two economy photos were subsequently replaced by individually commissioned
shop scenes of weighing loose nuts. Their records retain the replacement
review and source hashes; they replace existing entries, keeping the total 700.

The finalizer assigns matching short work situations and explicitly approved
compatible lesson kinds. Existing money/time scenes also support twenty
additional kinds with a separate, appropriate context sentence for each kind.
Unit-reference questions select a picture for the actual object: a paperclip
or pipette is never reused for a pallet. Border/surface exercises switch to
the corresponding image when the task changes from edging to coverage.
The metric series reuses suitable photos and uses the same material name
in the question and caption. Exact readouts remain native mathematical visuals.

`generation-jobs.json` preserves the 25 original generation prompts. Each
4 × 4 sheet contained sixteen independently described scenes. Technical
extraction produced the individual WebPs in `images/`; no duplicated files
are counted towards 400. Original generated sheets are not source assets.

Build embeds bytes only in the Worker and serves them on versioned,
whitelisted `/lesbeelden/*.webp` URLs. The initial page contains metadata,
not the 700 image payloads. Cards load lazily and expose a download link.

Run `node scripts/build.mjs` and `node scripts/test-photo-bank.mjs`.
The photo test verifies asset integrity, sector/lesson agreement, all four
slides, HTTP downloads/cache behavior and unchanged math and scheduling.
`scripts/package-photo-bank.py` creates the 700-file ZIP, or `--new` creates
the 300-file expansion ZIP, with a searchable index and Dutch CSV mapping.
It does not synthesize images.

Do not regenerate the manifest from scratch after images are authored.
Extend or replace individual records with deliberate subject review. A
photo illustrates the occupation; exact numbers, quantities and readable
measurements must come from the task's native visual and work order.
