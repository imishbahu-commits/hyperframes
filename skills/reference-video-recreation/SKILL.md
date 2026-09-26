---
name: reference-video-recreation
description: >
  Analyze one or more reference videos frame by frame, write a quantified timestamped style
  specification, and recreate the edit as an editable HyperFrames project with persistent source
  assets and a rendered review MP4. Use when the user asks to match, reproduce, clone, or recreate
  a reference video's visual language, cuts, camera motion, typography, timing, grading, or sound.
---

# Reference Video Recreation

Use this workflow when an existing video is the creative target. The output is not merely a render: deliver the original reference inventory, measured analysis, editable assets, editable HyperFrames source, review server, and final MP4.

> **Quality is the first priority.** Never save time by skipping frame inspection, reducing asset quality, flattening editable motion, using thumbnails in the final, or lowering final render settings. Save time only by caching completed work, parallelizing independent analysis, and avoiding repeated setup.

Read these before starting:

- [references/artifact-contract.md](references/artifact-contract.md) — durable files, cache layout, restart behavior, privacy
- [references/analysis-protocol.md](references/analysis-protocol.md) — mandatory two-pass viewing and measurement
- [references/quality-gates.md](references/quality-gates.md) — gates before preview and delivery

Load `/hyperframes-core`, `/hyperframes-keyframes`, `/hyperframes-animation`, `/hyperframes-creative`, `/media-use`, and `/hyperframes-cli`. Use `/hyperframes-audio` when the reference has music, speech, SFX, mixing, or automation that must be matched.

## Resume rule — run before creating anything

A request may resume a partially completed edit. Never regenerate assets merely because the current process did not create them.

1. Locate the project and reference file.
2. Read `.hyperframes/reference-recreation/checkpoint.json` when present.
3. Run:

```bash
node <SKILL_DIR>/scripts/checkpoint.mjs verify --project <PROJECT_DIR>
```

4. Inventory existing `analysis/`, `assets/`, `compositions/`, project HTML, renders, and review files.
5. Continue from the first failed gate. Preserve valid files byte-for-byte.
6. Regenerate only a missing, corrupt, rejected, or explicitly replaced artifact.

If no checkpoint exists but project files do, adopt them instead of restarting:

```bash
node <SKILL_DIR>/scripts/checkpoint.mjs create \
  --project <PROJECT_DIR> \
  --reference <REFERENCE_VIDEO>
```

## Workflow

### 1. Establish durable storage

Create the artifact layout from `artifact-contract.md`. The reference, analysis, alpha PNGs, composition source, audio, and approved render must not live only in `/tmp`, a process cache, an ignored build folder, or a server's memory.

Check ignore status before expensive work:

```bash
git check-ignore -v <PROJECT_DIR>/assets/example.png || true
git check-ignore -v <PROJECT_DIR>/analysis/style-spec.md || true
```

An Arena preview process is disposable. Files are the durable state. A process dying must require only a server restart, never a new analysis or render.

**Gate:** the reference is readable; editing source and generated assets use persistent paths; privacy and external-backup status are recorded in `analysis/retention.md`.

### 2. Analyze before building

Follow `analysis-protocol.md` exactly:

- first pass with sound
- second pass muted and frame-stepped
- timestamp and duration for every observation
- cut list and shot statistics
- camera and object motion measured numerically
- palette, typography, texture, linework, and grading measured
- audio BPM, beats, speech pace, and SFX synchronization measured when present
- 3–5 representative annotated frames per input video

Write:

```text
analysis/metadata.json
analysis/cuts.json
analysis/motion-tracks.json
analysis/audio-events.json
analysis/palette.json
analysis/contact-sheet.png
analysis/style-spec.md
```

Use low-resolution proxies only for detection speed. Recheck key frames at source resolution. A proxy or thumbnail must never enter the final composition.

**Gate:** `analysis/style-spec.md` can drive implementation without rewatching the video, and every generalization cites timestamped evidence.

### 3. Lock the recreation brief

Write `BRIEF.md` with:

- exact target duration and canvas
- whether content is duplicated or replaced
- elements that must remain exact
- permissible creative differences
- target delivery codec and resolution
- ownership/permission confirmation
- privacy and retention choice

When the user asked for an exact recreation but did not provide replacement content, reproduce the supplied reference's structure and timing. Do not silently invent a different story.

### 4. Build the asset inventory

Create `assets/manifest.json`. Every asset entry records source, generation prompt or extraction timestamp, dimensions, alpha status, intended scene, and approval state.

For generated or extracted PNGs:

- generate at or above final display resolution
- remove the background into real alpha; a painted checkerboard is not transparency
- inspect alpha at 200% against black, white, and accent backgrounds
- remove halos and disconnected matte fragments
- preserve a lossless PNG master
- keep original/generated source separately from the cleaned master

Run asset generation and independent background-removal jobs in parallel, but review every result individually. Never replace approved assets during a resume.

**Gate:** all visible assets pass the alpha, edge, resolution, and style checks in `quality-gates.md`.

### 5. Translate measurements into editable motion

Create `STORYBOARD.md` and one composition per coherent scene. Motion remains editable:

- position, scale, rotation, opacity, crop, and blur use explicit keyframes
- animate an inner visual wrapper, not framework-managed clip visibility
- separate independently moving body/prop parts when the reference demonstrates articulation
- use puppet or mesh deformation only where rigid transforms cannot match the observed silhouette
- register paused deterministic timelines in `window.__timelines`
- make cuts and transitions land on measured frames/audio events
- use source-resolution timing, including 30000/1001 when applicable

Do not substitute a still-frame slideshow for a reference containing meaningful internal motion. Still plates are acceptable only for genuinely static shots or an explicitly approved draft.

Checkpoint after each approved scene:

```bash
node <SKILL_DIR>/scripts/checkpoint.mjs create \
  --project <PROJECT_DIR> \
  --reference <REFERENCE_VIDEO>
```

### 6. Compare before final rendering

Use Studio and objective comparisons:

- inspect start/middle/end frames of every shot
- overlay recreation and reference at 50% opacity
- run difference/contact-sheet comparisons
- verify cut frames, positions, scales, colors, and text baselines
- listen once with sound and once muted
- fix drift before encoding

A successful lint is necessary but not sufficient. Visual comparison is mandatory.

**Gate:** no accidental frozen scene, missing audio, duplicated first shot, checkerboard matte, black frame, mistimed cut, or placeholder text.

### 7. Render and retain

Render drafts quickly if useful, but final quality stays high:

- native or requested resolution
- lossless PNG masters
- H.264 CRF 16–18 (or equivalent high-quality target)
- AAC 192 kbps when source quality supports it
- `+faststart` for web review
- preserve exact frame rate unless the user requests conversion

Place the approved output outside ignored build directories, for example:

```text
review-studio/final.mp4
```

Start a review server with byte-range support so browser seeking works. Confirm the MP4 exists and test a range request before announcing delivery.

Create the final checkpoint with the render:

```bash
node <SKILL_DIR>/scripts/checkpoint.mjs create \
  --project <PROJECT_DIR> \
  --reference <REFERENCE_VIDEO> \
  --render <FINAL_MP4>
```

Commit the skill/source project and safe assets. Do not commit a private reference video to a public repository. Use private object storage or a direct attachment for durable private media.

## Delivery report

State:

- project path
- final MP4 path
- review-server status
- duration, canvas, frame rate, codecs
- lint/check results
- checkpoint verification result
- retention level and any limitation
- known visual differences, if any

Never describe a draft as an exact match. Name remaining differences honestly.
