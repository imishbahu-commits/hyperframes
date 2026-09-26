#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

const SCHEMA_VERSION = 1;
const CHECKPOINT_RELATIVE = ".hyperframes/reference-recreation/checkpoint.json";
const ROOT_FILES = new Set([
  "BRIEF.md",
  "STORYBOARD.md",
  "STYLE-SPEC.md",
  "frame.md",
  "index.html",
  "hyperframes.json",
  "package.json",
]);
const INCLUDED_DIRS = new Set(["analysis", "assets", "compositions", "audio", "previews"]);
const EXCLUDED_NAMES = new Set([".DS_Store", ".gitkeep"]);

function usage(message) {
  if (message) console.error(`Error: ${message}\n`);
  console.error(`Usage:
  node checkpoint.mjs create --project <dir> --reference <video> [--render <mp4>]
  node checkpoint.mjs verify --project <dir>
`);
  process.exit(2);
}

function parseArgs(argv) {
  const command = argv[2];
  if (command !== "create" && command !== "verify") usage("command must be create or verify");
  const values = {};
  for (let i = 3; i < argv.length; i += 2) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (!flag?.startsWith("--") || !value) usage(`invalid argument near ${flag ?? "end"}`);
    values[flag.slice(2)] = value;
  }
  if (!values.project) usage("--project is required");
  if (command === "create" && !values.reference) usage("--reference is required for create");
  return { command, values };
}

function sha256(path) {
  const hash = createHash("sha256");
  hash.update(readFileSync(path));
  return hash.digest("hex");
}

function pathRecord(path, base) {
  const info = statSync(path);
  return {
    path:
      isAbsolute(path) && !path.startsWith(`${base}${sep}`)
        ? path
        : relative(base, path) || basename(path),
    bytes: info.size,
    sha256: sha256(path),
  };
}

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED_NAMES.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function importantFiles(project) {
  const files = [];
  for (const name of ROOT_FILES) {
    const path = join(project, name);
    if (existsSync(path) && statSync(path).isFile()) files.push(path);
  }
  for (const name of INCLUDED_DIRS) {
    const path = join(project, name);
    if (existsSync(path) && statSync(path).isDirectory()) files.push(...walk(path));
  }
  return [...new Set(files)].sort();
}

function checkpointPath(project) {
  return join(project, CHECKPOINT_RELATIVE);
}

function createCheckpoint(projectValue, referenceValue, renderValue) {
  const project = resolve(projectValue);
  const reference = resolve(referenceValue);
  if (!existsSync(project) || !statSync(project).isDirectory())
    usage(`project not found: ${project}`);
  if (!existsSync(reference) || !statSync(reference).isFile())
    usage(`reference not found: ${reference}`);
  const render = renderValue ? resolve(renderValue) : null;
  if (render && (!existsSync(render) || !statSync(render).isFile()))
    usage(`render not found: ${render}`);

  const files = importantFiles(project).map((path) => pathRecord(path, project));
  const checkpoint = {
    schemaVersion: SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    project: basename(project),
    reference: pathRecord(reference, project),
    referenceCacheKey: sha256(reference),
    render: render ? pathRecord(render, project) : null,
    files,
  };
  const output = checkpointPath(project);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(checkpoint, null, 2)}\n`);
  console.log(`Checkpoint written: ${output}`);
  console.log(
    `Reference: ${checkpoint.referenceCacheKey.slice(0, 16)} · ${checkpoint.reference.bytes} bytes`,
  );
  console.log(`Editing files: ${files.length}`);
  if (checkpoint.render)
    console.log(
      `Render: ${checkpoint.render.sha256.slice(0, 16)} · ${checkpoint.render.bytes} bytes`,
    );
}

function resolveRecordPath(recordPath, project) {
  return isAbsolute(recordPath) ? recordPath : resolve(project, recordPath);
}

function verifyRecord(record, project, label, failures) {
  const path = resolveRecordPath(record.path, project);
  if (!existsSync(path)) {
    failures.push(`${label}: missing ${record.path}`);
    return;
  }
  const info = statSync(path);
  if (!info.isFile()) {
    failures.push(`${label}: not a file ${record.path}`);
    return;
  }
  if (info.size !== record.bytes) failures.push(`${label}: size changed ${record.path}`);
  const currentHash = sha256(path);
  if (currentHash !== record.sha256) failures.push(`${label}: content changed ${record.path}`);
}

function verifyCheckpoint(projectValue) {
  const project = resolve(projectValue);
  const path = checkpointPath(project);
  if (!existsSync(path)) usage(`checkpoint not found: ${path}`);
  const checkpoint = JSON.parse(readFileSync(path, "utf8"));
  if (checkpoint.schemaVersion !== SCHEMA_VERSION)
    usage(`unsupported checkpoint schema: ${checkpoint.schemaVersion}`);

  const failures = [];
  verifyRecord(checkpoint.reference, project, "reference", failures);
  if (checkpoint.render) verifyRecord(checkpoint.render, project, "render", failures);
  for (const record of checkpoint.files) verifyRecord(record, project, "editing file", failures);

  if (failures.length) {
    console.error(`Checkpoint verification failed (${failures.length}):`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log(`Checkpoint verified: ${path}`);
  console.log(`Reference cache key: ${checkpoint.referenceCacheKey}`);
  console.log(`Editing files verified: ${checkpoint.files.length}`);
  if (checkpoint.render) console.log(`Render verified: ${checkpoint.render.path}`);
}

const { command, values } = parseArgs(process.argv);
if (command === "create") createCheckpoint(values.project, values.reference, values.render);
else verifyCheckpoint(values.project);
