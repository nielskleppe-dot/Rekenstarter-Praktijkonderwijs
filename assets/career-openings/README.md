# Opening photographs and professional conversation

Slide 1 always asks exactly two questions:

1. Wat zie je op deze foto?
2. An authored question about the actual work, material or service in that photo.

It contains no numeracy task, goal or work order. Those begin on slide 2.

The first photograph is selected by the actual material and sector. Reviewed
equivalent names (for example, bloem/meel and stekpotjes/kunststof potten) have explicit
aliases. A maths lesson kind never silently decides which object is pictured.
The existing 700 bank photographs remain intact. This folder adds 27 specific
workplace scenes where the old routes lacked an appropriate photo: retail
packing/presentation, care, hospitality, seedlings/seed preparation, a tool
cabinet, five sector-specific work discussions and five container applications.
The standalone clock is replaced on opening slides by the work context; exact
clock faces and other precise mathematical diagrams remain in the teaching task.

All 27 new scenes and the ten existing sector review sheets were visually
reviewed. `generation-jobs.json` preserves the briefs. `manifest.json` records
each question, subject, source grid cell, dimensions and SHA-256. WebP extraction
and resizing are technical steps; the photographs were created with imagegen.

Run `node scripts/build.mjs`, `node scripts/test-career-openings.mjs`, and the
existing presentation checks. The opening check covers all 2,180 curated
lesson/sector/phase cases, every bank subject, exactly two questions, correct
sector/material, the absence of numeracy questions and the new image routes.

Images are versioned, lazily loaded and cached through the existing whitelisted
image service. The initial page contains metadata, without the new image bytes.
