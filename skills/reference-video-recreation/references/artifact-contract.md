# Artifact and retention contract

## Canonical project layout

```text
<project>/
├── BRIEF.md
├── STORYBOARD.md
├── index.html
├── analysis/
│   ├── metadata.json
│   ├── cuts.json
│   ├── motion-tracks.json
│   ├── audio-events.json
│   ├── palette.json
│   ├── contact-sheet.png
│   ├── retention.md
│   └── style-spec.md
├── assets/
│   ├── manifest.json
│   ├── source/
│   ├── clean/
│   ├── audio/
│   └── fonts/
├── compositions/
│   └── scenes/
├── previews/
└── .hyperframes/reference-recreation/checkpoint.json

<workspace>/reference-uploads/   private source references
<workspace>/review-studio/      approved review MP4s and review UI
```

## Important editing files

The following are production state, not disposable output:

- the original reference or a durable locator plus its SHA-256
- `BRIEF.md`
- `analysis/style-spec.md` and every machine-readable analysis JSON
- annotated/contact-sheet frames
- asset prompts, source images, cleaned transparent PNG masters, and `assets/manifest.json`
- `STORYBOARD.md`
- all composition HTML/CSS/JS and local runtime/font dependencies
- audio masters and mix metadata
- comparison frames and QA notes
- the approved final MP4
- `.hyperframes/reference-recreation/checkpoint.json`

Do not put these only in `/tmp`, `node_modules`, `.cache`, `.venv`, `dist`, `build`, or another excluded directory.

## Persistence levels

| Level                                    | Survives process restart | Survives sandbox rebuild | Survives session deletion |
| ---------------------------------------- | -----------------------: | -----------------------: | ------------------------: |
| Running server memory                    |                       No |                       No |                        No |
| Temporary/ignored sandbox path           |               Usually no |             No guarantee |                        No |
| Unignored Arena workspace artifact       |                      Yes |              Best-effort |              No guarantee |
| Git commit (safe source/assets only)     |                      Yes |                      Yes |                       Yes |
| Private object storage/direct attachment |                      Yes |                      Yes |                       Yes |

A server is never the source of truth. Restarting a server should be sufficient to restore preview access because the MP4 and project remain on disk.

## Arena rule

Arena preserves workspace artifacts best-effort and patchset persistence has practical size limits. Keep private media unignored when relying on the active workspace, but do not Git-commit it to a public repository. Large or irreplaceable references require private external storage or a direct attachment.

Record the chosen retention in `analysis/retention.md`:

```markdown
# Retention

- Reference SHA-256: ...
- Reference location: ...
- Workspace persistence: unignored
- Git: source and safe generated assets only
- External backup: none | attachment | s3 | r2 | private-lfs | other
- Privacy: private; never publish
- Known retention limit: ...
```

## Cache identity

Use the reference video's SHA-256, not its filename, as cache identity. Filenames can change and collide; bytes do not.

A checkpoint records hashes, sizes, and paths. Verification detects:

- missing files
- changed files
- replacement references
- stale renders

Caching never lowers quality. It retains full-resolution accepted work so a resume avoids repeating it.

## Git policy

Commit:

- skills and scripts
- project source
- specifications and manifests
- safe generated assets that are appropriate for repository visibility

Do not commit by default:

- private/copyrighted reference videos
- credentials or signed URLs
- user media whose publication was not authorized
- replaceable caches larger than repository policy allows

Before committing, inspect the exact staged set with `git diff --cached --stat` and `git status --short`.
