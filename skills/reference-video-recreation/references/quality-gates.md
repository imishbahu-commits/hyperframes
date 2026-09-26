# Quality gates

## Gate A — analysis

- [ ] Every cut has a timestamp and frame number.
- [ ] Every motion claim has timestamped evidence.
- [ ] Camera and object motion are measured separately.
- [ ] Audio has been heard, measured, and synchronized to visual events.
- [ ] Key colors come from source-resolution frames.
- [ ] Uncertainty is marked as estimated.

## Gate B — assets

- [ ] PNG masters use real alpha, not a rendered checkerboard.
- [ ] Edges were inspected at 200% on black, white, and accent fields.
- [ ] No matte halo or clipped extremity remains.
- [ ] Display resolution never exceeds credible source/generation resolution without approval.
- [ ] Asset style, lighting, grain, and perspective match the measured reference.
- [ ] Approved assets are retained and not regenerated during resume.

## Gate C — motion

- [ ] Animation is editable by property.
- [ ] Internal movement is not replaced by a whole-image zoom when articulation is visible.
- [ ] Framework-managed clip visibility is not animated directly.
- [ ] Timelines are paused, deterministic, and registered.
- [ ] Cut and emphasis frames align with measured audio events.
- [ ] No scene freezes unintentionally after its entrance.

## Gate D — comparison

- [ ] Reference/recreation contact sheets use identical timestamps.
- [ ] Start, midpoint, and end of every shot were compared.
- [ ] Text baselines, object bounds, and camera framing were checked.
- [ ] Color and contrast were compared on source-resolution frames.
- [ ] The full recreation was watched once with sound and once muted.

## Gate E — render

- [ ] Hyperframes lint reports zero errors.
- [ ] Browser/runtime check passes when the environment supports it.
- [ ] Final duration and frame count match the target.
- [ ] Audio exists and ends correctly.
- [ ] No black, duplicate, missing, or corrupt frames appear.
- [ ] Web review supports byte-range seeking.
- [ ] The final MP4 is in a persistent, non-ignored location.
- [ ] Checkpoint verification passes.

## Final quality settings

Unless the user specifies otherwise:

- preserve source frame rate
- render at native or requested canvas size
- H.264 CRF 16–18 with medium/slow preset
- AAC 192 kbps when source quality supports it
- `yuv420p` for broad playback compatibility
- `+faststart` for browser review

Draft settings may be faster. Draft files are never silently promoted to final.
