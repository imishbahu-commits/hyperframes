# Frame-accurate analysis protocol

## Pass 1 — watch with sound

Watch every reference from beginning to end without pausing. Record:

- story and section structure
- narration pace and pauses
- music genre, tempo, downbeats, and section changes
- SFX and their visual synchronization
- emotional arc and emphasis moments

## Pass 2 — muted, frame-stepped

Mute audio and inspect every shot frame by frame. Record timestamps and durations for:

- every cut and transition
- camera scale/position/rotation
- subject and prop transforms
- internal articulation or deformation
- text entrances, holds, and exits
- blur, grain, shadows, masks, and overlays
- anticipation, overshoot, settle, and follow-through

No unsupported generalization is allowed. “Usually” requires at least three cited examples or all available occurrences when fewer than three exist.

## Required measurements

- source dimensions, frame rate, duration, codecs
- cut list with exact frame/time
- shot-length min, median, mean, max
- static/camera/character motion budget
- zoom start/end scale, duration, rate, and easing estimate
- x/y travel as pixels and percent of frame
- rotation in degrees
- opacity/blur timing
- dominant and accent colors with sampled hex values
- typography family class, weight, size/frame ratio, tracking, line height
- line/outline thickness as pixels and percent of frame width
- object bounds at representative frames
- BPM, beat timestamps, onset timestamps, voice WPM, and SFX offsets where applicable

Prefix estimated measurements with `~` and state why exact extraction was unavailable.

## Evidence package

For each reference produce:

- 3–5 annotated full-resolution frames
- one contact sheet
- one motion sheet around the most important action
- cut and audio-event JSON
- a markdown style specification with timestamps

## Multi-video comparison

When multiple references exist:

1. analyze independently
2. compare metrics in a single table
3. identify evolution by upload/date order
4. declare the target version
5. do not average incompatible styles into an invented hybrid unless requested

## Implementation translation

Every observed motion becomes one of:

- clip timing
- whole-scene camera track
- element transform track
- mask/crop track
- blur/opacity track
- separated-part rig
- deformation track
- drawing replacement/morph

Document the mapping in `analysis/motion-tracks.json` so implementation can be audited against observation.
