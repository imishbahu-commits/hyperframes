global.fetch = undefined;
const { createFFmpeg, fetchFile } = require("@ffmpeg/ffmpeg");
const fs = require("node:fs");
const path = require("node:path");

(async () => {
  const root = "/home/user/hyperframes";
  const ffmpeg = createFFmpeg({ log: true, corePath: require.resolve("@ffmpeg/core") });
  await ffmpeg.load();
  const files = {
    bg: "usa-finance-video/assets/background.png",
    fed: "usa-finance-video/assets/fed.png",
    card: "usa-finance-video/assets/card.png",
    house: "usa-finance-video/assets/house.png",
    savings: "usa-finance-video/assets/savings.png",
    market: "usa-finance-video/assets/market.png",
    voice: "usa-finance-video/voiceover.mp3",
  };
  for (const [name, relative] of Object.entries(files)) {
    const extension = path.extname(relative);
    ffmpeg.FS("writeFile", `${name}${extension}`, await fetchFile(path.join(root, relative)));
  }
  ffmpeg.FS(
    "writeFile",
    "font.ttf",
    await fetchFile("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
  );

  const title = (text, y, start, end, size = 54, color = "white") =>
    `drawtext=fontfile=/font.ttf:text='${text}':expansion=none:fontcolor=${color}:fontsize=${size}:borderw=4:bordercolor=#06101fcc:x=(w-text_w)/2:y=${y}:enable='between(t,${start},${end})'`;

  const filters = [
    "[0:v]format=rgba[base]",
    "[1:v]scale=630:-1,format=rgba,fade=t=in:st=0:d=0.35:alpha=1,fade=t=out:st=15.6:d=0.35:alpha=1[fed]",
    "[2:v]scale=520:-1,format=rgba,fade=t=in:st=18:d=0.3:alpha=1,fade=t=out:st=24.3:d=0.3:alpha=1[card]",
    "[3:v]scale=600:-1,format=rgba,fade=t=in:st=24.7:d=0.3:alpha=1,fade=t=out:st=31.7:d=0.3:alpha=1[house]",
    "[4:v]scale=500:-1,format=rgba,fade=t=in:st=31.7:d=0.3:alpha=1,fade=t=out:st=38.7:d=0.3:alpha=1[savings]",
    "[5:v]scale=620:-1,format=rgba,fade=t=in:st=38.7:d=0.3:alpha=1,fade=t=out:st=45:d=0.3:alpha=1[market]",
    "[base][fed]overlay=x='45+8*sin(t*1.4)':y='410+8*cos(t*1.6)':enable='between(t,0,16)'[v1]",
    "[v1][card]overlay=x='100+8*sin(t*2)':y=400:enable='between(t,18,24.65)'[v2]",
    "[v2][house]overlay=x=60:y='420+8*sin(t*1.5)':enable='between(t,24.7,32)'[v3]",
    "[v3][savings]overlay=x=110:y='390+10*sin(t*1.8)':enable='between(t,31.7,39)'[v4]",
    "[v4][market]overlay=x=50:y='420+8*cos(t*1.7)':enable='between(t,38.7,45.3)'[v5]",
    `[v5]${title("BREAKING • U.S. MONEY", 55, 0, 60, 22, "#55f2c1")},${title("THE FED JUST", 170, 0, 3, 58)},${title("RAISED RATES", 235, 0, 7, 76, "#ff5b67")},${title("FIRST TIME IN 3+ YEARS", 315, 3, 7, 32)},${title("YOUR MONEY MAY FEEL IT", 965, 5, 8, 38)},${title("NEW FED TARGET RANGE", 180, 7, 12, 30)},${title("3.75% — 4.00%", 245, 8, 13, 72, "#55f2c1")},${title("+0.25 POINT", 335, 10, 13, 30, "#ff5b67")},${title("WHY NOW?", 175, 12, 17, 62)},${title("INFLATION IS STILL ELEVATED", 250, 13, 17, 32, "#ffcc66")},${title("JOBS + SPENDING REMAIN RESILIENT", 305, 14, 17, 25)},${title("HERE’S THE WALLET IMPACT", 180, 16, 19, 43)},${title("1 / CREDIT CARDS", 170, 18, 24.65, 46)},${title("VARIABLE APR CAN MOVE HIGHER", 965, 19, 24.65, 32, "#ff5b67")},${title("CHECK YOUR RATE", 1020, 22, 24.65, 28)},${title("2 / MORTGAGES", 170, 24.7, 32, 46)},${title("NOT A ONE-TO-ONE FED MOVE", 965, 25, 28, 32)},${title("TREASURY YIELDS MATTER", 1015, 27, 32, 34, "#ffcc66")},${title("10-YEAR • 5.18% • SEP 24", 1060, 27, 30, 24)},${title("3 / SAVINGS", 170, 31.7, 39, 46)},${title("HIGHER YIELDS CAN HELP", 965, 32, 36, 35, "#55f2c1")},${title("COMPARE YOUR APY", 1015, 34, 39, 34)},${title("4 / STOCKS", 170, 38.7, 45.3, 46)},${title("SAFE YIELDS ARE COMPETITION", 965, 39, 42, 30)},${title("VALUATIONS FACE PRESSURE", 1010, 40.5, 45, 32, "#ffcc66")},${title("THREE MOVES TO CONSIDER", 170, 45, 55, 42)},${title("01  ATTACK HIGH-INTEREST DEBT", 340, 46, 50, 31)},${title("02  COMPARE YOUR SAVINGS RATE", 440, 49, 53, 30, "#55f2c1")},${title("03  DON’T PANIC-SELL", 540, 52, 56, 36)},${title("FOLLOW YOUR DIVERSIFIED PLAN", 600, 53, 56, 27)},${title("THE REAL STORY ISN’T ONE HIKE", 275, 55, 58, 38)},${title("HOW LONG DO RATES STAY HIGH?", 345, 56, 59, 42, "#ffcc66")},${title("FOLLOW FOR U.S. MONEY NEWS", 420, 58, 60, 46, "#55f2c1")},${title("General information — not personalized financial advice.", 1120, 0, 60, 18, "#b6c2d4")},drawbox=x=45:y=1085:w='(t/60)*630':h=5:color=#55f2c1:t=fill[outv]`,
    "[6:a]apad=pad_dur=3[aout]",
  ];

  const args = [];
  for (const name of ["bg", "fed", "card", "house", "savings", "market"])
    args.push("-loop", "1", "-framerate", "30", "-i", `${name}.png`);
  args.push(
    "-i",
    "voice.mp3",
    "-filter_complex",
    filters.join(";"),
    "-map",
    "[outv]",
    "-map",
    "[aout]",
    "-t",
    "60",
    "-r",
    "30",
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-crf",
    "22",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "usa-finance-final.mp4",
  );
  await ffmpeg.run(...args);
  const output = path.join(root, "usa-finance-video/review/usa-finance-fed-rates.mp4");
  fs.writeFileSync(output, ffmpeg.FS("readFile", "usa-finance-final.mp4"));
  console.log(`RENDER_COMPLETE ${output}`);
})();
