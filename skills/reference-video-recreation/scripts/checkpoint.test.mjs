import { strict as assert } from "node:assert";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, "checkpoint.mjs");

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "reference-checkpoint-"));
  const project = join(root, "project");
  const assets = join(project, "assets");
  mkdirSync(assets, { recursive: true });
  writeFileSync(join(project, "index.html"), "<main>first</main>\n");
  writeFileSync(join(assets, "subject.png"), "png-master");
  const reference = join(root, "reference.mp4");
  const render = join(root, "final.mp4");
  writeFileSync(reference, "reference-bytes");
  writeFileSync(render, "render-bytes");
  return { project, reference, render };
}

test("creates and verifies a checkpoint", () => {
  const { project, reference, render } = fixture();
  execFileSync(process.execPath, [
    script,
    "create",
    "--project",
    project,
    "--reference",
    reference,
    "--render",
    render,
  ]);
  const checkpoint = JSON.parse(
    readFileSync(join(project, ".hyperframes/reference-recreation/checkpoint.json"), "utf8"),
  );
  assert.equal(checkpoint.schemaVersion, 1);
  assert.equal(checkpoint.files.length, 2);
  assert.equal(checkpoint.reference.bytes, 15);
  assert.equal(checkpoint.render.bytes, 12);
  execFileSync(process.execPath, [script, "verify", "--project", project]);
});

test("fails verification when an editing file changes", () => {
  const { project, reference } = fixture();
  execFileSync(process.execPath, [
    script,
    "create",
    "--project",
    project,
    "--reference",
    reference,
  ]);
  writeFileSync(join(project, "index.html"), "<main>changed</main>\n");
  const result = spawnSync(process.execPath, [script, "verify", "--project", project], {
    encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /content changed index\.html/);
});

test("uses an absolute path for a reference outside the project", () => {
  const { project, reference } = fixture();
  execFileSync(process.execPath, [
    script,
    "create",
    "--project",
    project,
    "--reference",
    reference,
  ]);
  const checkpoint = JSON.parse(
    readFileSync(join(project, ".hyperframes/reference-recreation/checkpoint.json"), "utf8"),
  );
  assert.equal(checkpoint.reference.path, resolve(reference));
});
