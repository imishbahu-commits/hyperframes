#!/usr/bin/env node
import { createServer } from "node:http";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, open, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const ROOT = resolve(fileURLToPath(new URL("../reference-uploads", import.meta.url)));
const PARTS = join(ROOT, ".chunks");
const PORT = Number(process.env.PORT || 3003);
const HOST = process.env.HOST || "0.0.0.0";
const REPO_ROOT = resolve(ROOT, "..");
const MAX_FILE_BYTES = 95 * 1024 ** 2; // GitHub rejects individual Git blobs over 100 MB.
const MAX_CHUNK_BYTES = 16 * 1024 ** 2;
const execFileAsync = promisify(execFile);
let gitQueue = Promise.resolve();
await mkdir(PARTS, { recursive: true });

const MIME = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};
const json = (res, status, value) => {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(body),
    "cache-control": "no-store",
  });
  res.end(body);
};
const cleanName = (value) => {
  const printable = Array.from(basename(String(value || "reference-video")), (character) =>
    character.charCodeAt(0) < 32 ? "_" : character,
  ).join("");
  return printable.replace(/[<>:"/\\|?*]/g, "_").slice(0, 220) || "reference-video";
};
const uploadDir = (id) => join(PARTS, id);
const validId = (id) => /^[a-f0-9-]{36}$/.test(id);
const withGitQueue = (task) => {
  const result = gitQueue.then(task, task);
  gitQueue = result.catch(() => {});
  return result;
};

async function currentBranch() {
  const { stdout } = await execFileAsync("git", ["branch", "--show-current"], { cwd: REPO_ROOT });
  const branch = stdout.trim();
  if (!branch.startsWith("arena/"))
    throw new Error(`refusing to persist from unexpected branch: ${branch}`);
  return branch;
}

async function persistToPublicGit(path) {
  const branch = await currentBranch();
  const relativePath = path.slice(REPO_ROOT.length + 1);
  await execFileAsync("git", ["add", "-f", "--", relativePath], { cwd: REPO_ROOT });
  await execFileAsync(
    "git",
    [
      "commit",
      "--no-verify",
      "--only",
      "-m",
      `chore(reference): persist ${basename(path)}`,
      "--",
      relativePath,
    ],
    { cwd: REPO_ROOT },
  );
  await execFileAsync("git", ["push", "origin", `HEAD:${branch}`], { cwd: REPO_ROOT });
  return branch;
}

async function removeFromPublicGit(path) {
  const branch = await currentBranch();
  const relativePath = path.slice(REPO_ROOT.length + 1);
  await execFileAsync("git", ["rm", "-f", "--", relativePath], { cwd: REPO_ROOT });
  await execFileAsync(
    "git",
    [
      "commit",
      "--no-verify",
      "--only",
      "-m",
      `chore(reference): remove ${basename(path)}`,
      "--",
      relativePath,
    ],
    { cwd: REPO_ROOT },
  );
  await execFileAsync("git", ["push", "origin", `HEAD:${branch}`], { cwd: REPO_ROOT });
}

async function bodyJson(req) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 64 * 1024) throw new Error("request too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
async function uniquePath(name) {
  const ext = extname(name);
  const stem = basename(name, ext);
  let candidate = join(ROOT, name);
  let count = 2;
  while (
    await stat(candidate).then(
      () => true,
      () => false,
    )
  )
    candidate = join(ROOT, `${stem}-${count++}${ext}`);
  return candidate;
}
async function listFiles() {
  const entries = await readdir(ROOT, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((e) => e.isFile() && !e.name.startsWith("."))
      .map(async (entry) => {
        const info = await stat(join(ROOT, entry.name));
        return {
          name: entry.name,
          size: info.size,
          modified: info.mtime.toISOString(),
          url: `/files/${encodeURIComponent(entry.name)}`,
        };
      }),
  );
  return files.sort((a, b) => b.modified.localeCompare(a.modified));
}
async function serveFile(req, res, name) {
  const safe = cleanName(name);
  if (safe !== name) return json(res, 400, { error: "invalid filename" });
  const path = join(ROOT, safe);
  const info = await stat(path).catch(() => null);
  if (!info?.isFile()) return json(res, 404, { error: "not found" });
  const type = MIME[extname(safe).toLowerCase()] || "application/octet-stream";
  const range = req.headers.range;
  res.setHeader("accept-ranges", "bytes");
  res.setHeader("content-type", type);
  if (!range) {
    res.writeHead(200, {
      "content-length": info.size,
      "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(safe)}`,
    });
    return createReadStream(path).pipe(res);
  }
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) return res.writeHead(416, { "content-range": `bytes */${info.size}` }).end();
  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1;
  if (start > end || start >= info.size)
    return res.writeHead(416, { "content-range": `bytes */${info.size}` }).end();
  res.writeHead(206, {
    "content-range": `bytes ${start}-${end}/${info.size}`,
    "content-length": end - start + 1,
  });
  createReadStream(path, { start, end }).pipe(res);
}

const PAGE = String.raw`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reference Drop</title><style>
:root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:#080a0e;color:#f6f7fb}.shell{width:min(1000px,calc(100% - 36px));margin:0 auto;padding:64px 0}.top{display:flex;align-items:center;justify-content:space-between;margin-bottom:36px}.brand{display:flex;align-items:center;gap:12px;font-weight:700}.mark{width:13px;height:13px;border-radius:4px;background:#8d78ff;box-shadow:0 0 24px #7058ff}.status{font-size:12px;color:#68dbb7;border:1px solid #245947;padding:7px 11px;border-radius:99px}h1{font-size:clamp(42px,7vw,78px);letter-spacing:-.055em;line-height:.95;margin:0 0 18px;max-width:750px}p{color:#9299a8;font-size:18px;line-height:1.55;max-width:680px}.drop{margin-top:38px;border:1px dashed #343946;border-radius:24px;padding:55px 24px;text-align:center;background:linear-gradient(145deg,#11141b,#0c0f14);transition:.18s}.drop.over{border-color:#917dff;background:#151329;transform:scale(1.005)}.drop strong{display:block;font-size:21px;margin-bottom:9px}.drop span{color:#777f90}.pick{margin-top:22px;border:0;border-radius:12px;background:#7c67f4;color:white;font-weight:700;padding:13px 20px;cursor:pointer}.hint{font-size:12px!important;color:#5e6572!important;margin:15px auto 0}.queue{margin-top:28px;display:grid;gap:10px}.job,.file{border:1px solid #20242d;border-radius:15px;padding:16px 18px;background:#0e1117}.row{display:flex;justify-content:space-between;gap:16px;align-items:center}.name{font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.meta{font-size:12px;color:#747c8b;margin-top:7px}.bar{height:5px;background:#242834;border-radius:9px;overflow:hidden;margin-top:13px}.fill{height:100%;width:0;background:linear-gradient(90deg,#745cff,#4fd9b4);transition:width .15s}.filesHead{display:flex;justify-content:space-between;align-items:end;margin:45px 0 12px}.filesHead h2{margin:0;font-size:19px}.file a{color:#d9d4ff;text-decoration:none}.delete{border:0;background:transparent;color:#777f90;cursor:pointer}.empty{color:#555d6a;padding:20px 0}.speed{color:#62dbb5}input{display:none}@media(max-width:600px){.shell{padding-top:34px}.top{margin-bottom:45px}.drop{padding:40px 18px}}
</style></head><body><main class="shell"><div class="top"><div class="brand"><i class="mark"></i>Reference Drop</div><div class="status">Public Git persistence enabled</div></div><h1>Send reference videos at full speed.</h1><p>Files stream into the workspace in parallel chunks, then commit and push to the public session branch. “Ready” means the upload survived the sandbox and is durable in Git.</p><section id="drop" class="drop"><strong>Drop videos here</strong><span>or select multiple reference files</span><br><button class="pick" id="pick">Choose files</button><input id="input" type="file" multiple accept="video/*,audio/*,image/*"><p class="hint">Parallel transfer + automatic retries · public storage · 95 MB maximum per file</p></section><div id="queue" class="queue"></div><div class="filesHead"><h2>Git-persisted references</h2><button class="delete" onclick="loadFiles()">Refresh</button></div><div id="files"></div></main><script>
const CHUNK=12*1024*1024, WORKERS=6;const input=document.querySelector('#input'),drop=document.querySelector('#drop'),queue=document.querySelector('#queue');
const size=n=>n>1073741824?(n/1073741824).toFixed(2)+' GB':n>1048576?(n/1048576).toFixed(1)+' MB':(n/1024).toFixed(0)+' KB';
document.querySelector('#pick').onclick=()=>input.click();input.onchange=()=>uploadAll([...input.files]);['dragenter','dragover'].forEach(e=>drop.addEventListener(e,x=>{x.preventDefault();drop.classList.add('over')}));['dragleave','drop'].forEach(e=>drop.addEventListener(e,x=>{x.preventDefault();drop.classList.remove('over')}));drop.addEventListener('drop',e=>uploadAll([...e.dataTransfer.files]));
async function request(url,options){const r=await fetch(url,options);if(!r.ok)throw new Error((await r.json().catch(()=>({}))).error||'HTTP '+r.status);return r.json()}
function uploadAll(files){files.forEach(uploadFile);input.value=''}
async function uploadFile(file){const job=document.createElement('div');job.className='job';job.innerHTML='<div class="row"><div class="name"></div><div class="speed">Starting…</div></div><div class="meta"></div><div class="bar"><div class="fill"></div></div>';queue.prepend(job);job.querySelector('.name').textContent=file.name;const meta=job.querySelector('.meta'),speed=job.querySelector('.speed'),fill=job.querySelector('.fill');const total=Math.ceil(file.size/CHUNK)||1,start=performance.now();let done=0;
try{const init=await request('/api/uploads/init',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:file.name,size:file.size,totalChunks:total})});let next=0;async function worker(){while(next<total){const i=next++,blob=file.slice(i*CHUNK,Math.min(file.size,(i+1)*CHUNK));let error;for(let attempt=0;attempt<3;attempt++){try{await request('/api/uploads/'+init.id+'/chunks/'+i,{method:'PUT',headers:{'content-type':'application/octet-stream'},body:blob});error=null;break}catch(e){error=e;await new Promise(r=>setTimeout(r,500*(attempt+1)))}}if(error)throw error;done+=blob.size;const pct=Math.min(100,done/file.size*100);fill.style.width=pct+'%';const seconds=(performance.now()-start)/1000;speed.textContent=size(done/Math.max(seconds,.1))+'/s';meta.textContent=size(done)+' of '+size(file.size)+' · '+pct.toFixed(0)+'%'}}await Promise.all(Array.from({length:Math.min(WORKERS,total)},worker));speed.textContent='Persisting…';meta.textContent='Upload complete · committing and pushing durable Git copy';const result=await request('/api/uploads/'+init.id+'/finalize',{method:'POST'});fill.style.width='100%';speed.textContent='Ready';meta.textContent=size(file.size)+' · public Git backup on '+result.branch;loadFiles()}catch(e){speed.textContent='Failed';speed.style.color='#ff7884';meta.textContent=e.message}}
async function loadFiles(){const host=document.querySelector('#files');try{const {files}=await request('/api/files');host.innerHTML=files.length?'':'<div class="empty">No references uploaded yet.</div>';for(const f of files){const el=document.createElement('div');el.className='file';el.innerHTML='<div class="row"><div><a target="_blank"></a><div class="meta"></div></div><button class="delete">Delete</button></div>';const a=el.querySelector('a');a.textContent=f.name;a.href=f.url;el.querySelector('.meta').textContent=size(f.size)+' · '+new Date(f.modified).toLocaleString();el.querySelector('button').onclick=async()=>{if(confirm('Remove '+f.name+' from the current branch? Public Git history may still retain its bytes.')){await request('/api/files/'+encodeURIComponent(f.name),{method:'DELETE'});loadFiles()}};host.append(el)}}catch(e){host.innerHTML='<div class="empty">Could not load uploads.</div>'}}loadFiles();
</script></body></html>`;

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    if ((req.method === "GET" || req.method === "HEAD") && url.pathname === "/") {
      res.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "content-length": Buffer.byteLength(PAGE),
        "cache-control": "no-store",
      });
      return res.end(req.method === "HEAD" ? undefined : PAGE);
    }
    if (req.method === "GET" && url.pathname === "/api/files")
      return json(res, 200, { files: await listFiles(), directory: ROOT });
    if (req.method === "POST" && url.pathname === "/api/uploads/init") {
      const data = await bodyJson(req);
      const name = cleanName(data.name);
      const size = Number(data.size);
      const totalChunks = Number(data.totalChunks);
      if (!Number.isSafeInteger(size) || size < 0 || size > MAX_FILE_BYTES)
        return json(res, 400, { error: "invalid file size or file exceeds the 95 MB Git limit" });
      if (!Number.isInteger(totalChunks) || totalChunks < 1 || totalChunks > 2000)
        return json(res, 400, { error: "invalid chunk count" });
      const id = randomUUID();
      await mkdir(uploadDir(id));
      await writeFile(
        join(uploadDir(id), "meta.json"),
        JSON.stringify({ name, size, totalChunks, created: Date.now() }),
      );
      return json(res, 201, { id, chunkBytes: MAX_CHUNK_BYTES });
    }
    let match = /^\/api\/uploads\/([^/]+)\/chunks\/(\d+)$/.exec(url.pathname);
    if (req.method === "PUT" && match) {
      const [, id, rawIndex] = match;
      if (!validId(id)) return json(res, 400, { error: "invalid upload" });
      const meta = JSON.parse(await readFile(join(uploadDir(id), "meta.json"), "utf8"));
      const index = Number(rawIndex);
      if (!Number.isInteger(index) || index < 0 || index >= meta.totalChunks)
        return json(res, 400, { error: "invalid chunk" });
      const temp = join(uploadDir(id), `${index}.uploading`),
        target = join(uploadDir(id), `${index}.part`);
      let bytes = 0;
      req.on("data", (chunk) => {
        bytes += chunk.length;
        if (bytes > MAX_CHUNK_BYTES) req.destroy(new Error("chunk too large"));
      });
      await pipeline(req, createWriteStream(temp));
      await rename(temp, target);
      return json(res, 201, { ok: true, index, bytes });
    }
    match = /^\/api\/uploads\/([^/]+)\/finalize$/.exec(url.pathname);
    if (req.method === "POST" && match) {
      const id = match[1];
      if (!validId(id)) return json(res, 400, { error: "invalid upload" });
      const dir = uploadDir(id),
        meta = JSON.parse(await readFile(join(dir, "meta.json"), "utf8"));
      for (let i = 0; i < meta.totalChunks; i++)
        if (!(await stat(join(dir, `${i}.part`)).catch(() => null)))
          return json(res, 409, { error: `chunk ${i} is missing` });
      const destination = await uniquePath(meta.name),
        partial = `${destination}.partial`;
      const handle = await open(partial, "w");
      await handle.close();
      for (let i = 0; i < meta.totalChunks; i++)
        await pipeline(
          createReadStream(join(dir, `${i}.part`)),
          createWriteStream(partial, { flags: "a" }),
        );
      const info = await stat(partial);
      if (info.size !== meta.size) {
        await rm(partial, { force: true });
        return json(res, 409, { error: "uploaded size did not match source" });
      }
      await rename(partial, destination);
      // "Ready" is a durability boundary: acknowledge only after GitHub accepts
      // the commit. Keep the chunks available when persistence fails.
      const branch = await withGitQueue(() => persistToPublicGit(destination));
      await rm(dir, { recursive: true, force: true });
      return json(res, 201, {
        ok: true,
        persistent: true,
        public: true,
        branch,
        name: basename(destination),
        size: info.size,
        path: destination,
      });
    }
    match = /^\/files\/(.+)$/.exec(url.pathname);
    if (req.method === "GET" && match) return serveFile(req, res, decodeURIComponent(match[1]));
    match = /^\/api\/files\/(.+)$/.exec(url.pathname);
    if (req.method === "DELETE" && match) {
      const name = decodeURIComponent(match[1]),
        safe = cleanName(name);
      if (safe !== name) return json(res, 400, { error: "invalid filename" });
      const path = join(ROOT, safe);
      await withGitQueue(() => removeFromPublicGit(path));
      return json(res, 200, {
        ok: true,
        warning: "Removed from the current branch; public Git history may retain earlier bytes.",
      });
    }
    json(res, 404, { error: "not found" });
  } catch (error) {
    console.error(error);
    if (!res.headersSent)
      json(res, 500, { error: error instanceof Error ? error.message : "server error" });
    else res.destroy();
  }
});
server.listen(PORT, HOST, () =>
  console.log(
    `Reference upload server listening on http://${HOST}:${PORT}\nPublic Git-backed storage: ${ROOT}`,
  ),
);
