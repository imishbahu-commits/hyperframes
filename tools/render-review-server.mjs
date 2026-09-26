#!/usr/bin/env node
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";

const PORT = Number(process.env.PORT || 3004);
const HOST = process.env.HOST || "0.0.0.0";
const rendered = resolve("review-studio/recreated-style.mp4");
const reference = resolve(
  "reference-uploads/From Klickpin.com- Snack Board Ideas That Make Everyday Better 80238-pin-id-12947917676304943.mp4",
);

const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Render Review Studio</title><style>
:root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif}*{box-sizing:border-box}body{margin:0;background:#08090c;color:#f3f4f7;min-height:100vh}.shell{width:min(1180px,calc(100% - 28px));margin:auto;padding:28px 0 48px}.head{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px}.brand{display:flex;align-items:center;gap:11px;font-weight:750}.dot{width:11px;height:11px;border-radius:3px;background:#d7ff00;box-shadow:0 0 22px #d7ff00}.ready{color:#8be6bf;border:1px solid #285c48;border-radius:99px;padding:7px 11px;font-size:12px}.stage{display:grid;grid-template-columns:minmax(300px,510px) 1fr;gap:24px;align-items:start}.player{border:1px solid #292d36;border-radius:22px;padding:14px;background:#11141a;box-shadow:0 32px 90px #0008}video{display:block;width:100%;max-height:76vh;aspect-ratio:9/16;background:#000;border-radius:13px}.panel{padding:18px 6px}h1{font-size:clamp(34px,5vw,66px);line-height:.98;letter-spacing:-.05em;margin:8px 0 16px}.sub{color:#8c93a2;line-height:1.55;max-width:520px}.tabs{display:flex;gap:8px;margin:28px 0 15px}.tab,.download{appearance:none;border:1px solid #313640;background:#171a21;color:#adb3c0;padding:11px 14px;border-radius:11px;cursor:pointer;font-weight:650;text-decoration:none;display:inline-block}.tab.active{background:#d7ff00;color:#101107;border-color:#d7ff00}.download{margin-top:20px;color:#fff}.facts{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-top:24px}.fact{border:1px solid #252932;background:#101218;border-radius:12px;padding:13px}.fact b{display:block;font-size:11px;color:#6e7583;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px}.fact span{font-weight:700}@media(max-width:820px){.stage{grid-template-columns:1fr}.player{max-width:520px;margin:auto}.panel{padding:8px 2px}}
</style></head><body><main class="shell"><header class="head"><div class="brand"><i class="dot"></i>Render Review Studio</div><div class="ready">MP4 ready</div></header><section class="stage"><div class="player"><video id="video" controls playsinline preload="metadata" src="/video/rendered"></video></div><div class="panel"><div style="color:#d7ff00;font-size:12px;font-weight:800;letter-spacing:.14em">HYPERFRAMES RECREATION</div><h1>Every frame tells a story.</h1><p class="sub">Watch the finished vertical motion edit, switch to the uploaded reference for comparison, or download the rendered MP4 directly.</p><div class="tabs"><button class="tab active" data-src="/video/rendered">Rendered video</button><button class="tab" data-src="/video/reference">Original reference</button></div><div class="facts"><div class="fact"><b>Format</b><span>MP4 · H.264</span></div><div class="fact"><b>Canvas</b><span>720 × 1280</span></div><div class="fact"><b>Duration</b><span>11.93 seconds</span></div><div class="fact"><b>Frame rate</b><span>30 FPS</span></div></div><a class="download" href="/video/rendered?download=1">Download rendered MP4</a></div></section></main><script>
const video=document.querySelector('#video');document.querySelectorAll('.tab').forEach(button=>button.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));button.classList.add('active');const playing=!video.paused;video.src=button.dataset.src;video.load();if(playing)video.play()});
</script></body></html>`;

async function sendVideo(req, res, path, download = false) {
  const info = await stat(path);
  const range = req.headers.range;
  const headers = {
    "content-type": "video/mp4",
    "accept-ranges": "bytes",
    "cache-control": "no-cache",
    ...(download
      ? { "content-disposition": 'attachment; filename="hyperframes-recreated-style.mp4"' }
      : {}),
  };
  if (!range) {
    res.writeHead(200, { ...headers, "content-length": info.size });
    return createReadStream(path).pipe(res);
  }
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) return res.writeHead(416, { "content-range": `bytes */${info.size}` }).end();
  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1;
  res.writeHead(206, {
    ...headers,
    "content-range": `bytes ${start}-${end}/${info.size}`,
    "content-length": end - start + 1,
  });
  createReadStream(path, { start, end }).pipe(res);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    if ((req.method === "GET" || req.method === "HEAD") && url.pathname === "/") {
      res.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "content-length": Buffer.byteLength(page),
        "cache-control": "no-store",
      });
      return res.end(req.method === "HEAD" ? undefined : page);
    }
    if (req.method === "GET" && url.pathname === "/video/rendered")
      return sendVideo(req, res, rendered, url.searchParams.get("download") === "1");
    if (req.method === "GET" && url.pathname === "/video/reference")
      return sendVideo(req, res, reference);
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.writeHead(500, { "content-type": "text/plain" });
    res.end("Video unavailable");
  }
});

server.listen(PORT, HOST, () =>
  console.log(`Render Review Studio listening on http://${HOST}:${PORT}`),
);
