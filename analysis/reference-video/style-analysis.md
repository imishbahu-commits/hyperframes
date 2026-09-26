# Reference video analysis

## Source identity

- File: `From Klickpin.com- Snack Board Ideas That Make Everyday Better 80238-pin-id-12947917676304943.mp4`
- SHA-256: `fd0cd5e0d3a468e0e196a83d4bfbcd6cd7f31a8f358d03fb5402fff6f07fd607`
- File size: 1,546,244 bytes
- Canvas: vertical 9:16.
- Measured audio duration: 11.960 s. Visual endpoint is approximately 11.93 s (estimate from extracted frames).
- Only one distinct supplied video is currently available, so there is no cross-video style evolution to compare.

## Pass 1 — with sound

The soundtrack is a short rhythmic edit bed rather than dialogue-led narration. The image changes and scale/blur impulses are synchronized to transient groups.

- **00:00.00–00:00.75 (0.75 s):** opening impact; the strongest measured 250 ms RMS window is at **00:00.25–00:00.50 (0.25 s)**. The lime bar and philosopher image resolve on this accent.
- **00:01.75–00:02.50 (0.75 s):** second transient group, with a measured local RMS maximum at **00:02.00–00:02.25 (0.25 s)**; it motivates the cut into the yellow-circle scene.
- **00:04.20–00:05.10 (0.90 s):** two short pulses (estimated from 250 ms RMS bins), aligned with the “every frame” reveal and scanning overlay.
- **00:06.75–00:08.00 (1.25 s):** densest sustained energy after the opening. Measured peaks occur across **00:07.00–00:07.75 (0.75 s)**; the computer scene lands here and then pushes in.
- **00:08.75–00:09.50 (0.75 s):** final pronounced transient group; the heart/feeling card replaces the computer scene.
- **00:10.25–00:11.96 (1.71 s):** energy decays into the credit. The last **00:11.75–00:11.96 (0.21 s)** is near silence by waveform RMS.

Measured waveform facts: mono, 22,050 Hz PCM analysis copy; full-track RMS 1,965 and peak 14,445 on a 16-bit scale. Timing resolution for the energy notes is 0.25 s, so locations within each bin are estimates.

## Pass 2 — muted and frame-by-frame

### Shot and transition map

1. **00:00.00–00:02.20 (2.20 s): Storytelling card**
   - **00:00.00–00:00.40 (0.40 s, estimate):** pale paper field; neon-lime strip sweeps horizontally.
   - **00:00.25–00:00.90 (0.65 s, estimate):** grayscale philosopher/computer collage enters oversized, blurred, and slightly rotated; it rapidly resolves into focus.
   - **00:00.55–00:01.30 (0.75 s, estimate):** repeated condensed “STORYTELLING” typography becomes legible behind the cutout.
   - **00:01.30–00:01.98 (0.68 s, estimate):** subtle settle/drift, approximately 3–5% scale change.
   - **00:01.98–00:02.20 (0.22 s, estimate):** fast scale-up plus defocus transition.

2. **00:02.20–00:04.40 (2.20 s): Every cut is a decision**
   - **00:02.20–00:02.70 (0.50 s, estimate):** yellow sphere resolves from blur and expands to roughly half the canvas width.
   - **00:02.55–00:03.20 (0.65 s, estimate):** suited figure slides in from frame-right while “every / cut” holds top-left.
   - **00:03.40–00:04.15 (0.75 s, estimate):** “is a Decision” assembles in staggered word fragments; figure/circle drift slightly down-left.
   - **00:04.16–00:04.40 (0.24 s, estimate):** defocus and brightness wash prepare the next card.

3. **00:04.40–00:07.07 (2.67 s): Every frame tells a story**
   - **00:04.40–00:04.90 (0.50 s, estimate):** camera-focus brackets and lime vertical block snap in around the central figure.
   - **00:04.62–00:05.50 (0.88 s, estimate):** translucent lime scan travels left-to-right across the full composition.
   - **00:05.45–00:05.75 (0.30 s, estimate):** abrupt punch-in reframes the television-headed figure along frame-left.
   - **00:05.60–00:06.60 (1.00 s, estimate):** “tells / a / Story” reveals one line at a time at center-right.
   - **00:06.87–00:07.07 (0.20 s, estimate):** leftward motion-blur wipe.

4. **00:07.07–00:09.01 (1.94 s): Editing is more than a skill**
   - **00:07.07–00:07.60 (0.53 s, estimate):** vintage computer arrives from a large, soft, offset state and locks near lower center.
   - **00:07.58–00:08.05 (0.47 s, estimate):** yellow annotation strokes draw on around the monitor and headline.
   - **00:08.06–00:08.78 (0.72 s, estimate):** camera pushes approximately 20–25% closer and shifts left; “than a SKILL” becomes the right-side counterweight.
   - **00:08.78–00:09.01 (0.23 s, estimate):** zoom/defocus exit.

5. **00:09.01–00:10.46 (1.45 s): It’s a feeling**
   - **00:09.01–00:09.45 (0.44 s, estimate):** anatomical heart resolves from soft focus at center.
   - **00:09.25–00:10.20 (0.95 s, estimate):** compact text sits across the heart; a thin underline extends rightward while the card breathes with a very slow push.
   - **00:10.20–00:10.46 (0.26 s, estimate):** heart and text contract/fade toward center.

6. **00:10.46–00:11.93 (1.47 s): Credit**
   - **00:10.46–00:11.10 (0.64 s, estimate):** small serif “edit by” resolves near center.
   - **00:10.85–00:11.50 (0.65 s, estimate):** handwritten signature appears to the right.
   - **00:11.50–00:11.93 (0.43 s, estimate):** quiet hold on textured off-white.

## Style system to reproduce

- **Palette:** warm off-white/gray paper, near-black, grayscale photo cutouts, and one electric lime accent (approximately `#D8FF00`, estimate). A warmer yellow appears around the computer scene.
- **Typography:** heavy grotesk/Arial-like sans with tight leading and tracking, mixed with a high-contrast serif and handwritten credit.
- **Depth:** soft contact shadows, oversized cutouts, shallow-focus blur at nearly every scene boundary, faint vignette, and paper/grain overlay.
- **Motion:** fast 0.20–0.55 s entrances; 0.65–1.20 s restrained holds; 0.20–0.26 s blur/zoom exits. Movement is predominantly 2D scale and translation with occasional rotation.
- **Composition:** asymmetric editorial poster layouts; large central object, text used as both message and texture, generous negative space.
- **Target:** preserve the 11.93 s cadence, six-card structure, beat-synchronized transitions, grayscale/lime treatment, and blur-driven camera language rather than copying only individual still frames.
