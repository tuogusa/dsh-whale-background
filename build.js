// build.js — 把 assets/wallpaper.jpg 以 base64 内联进客户端 bundle，生成 lib/client.js。
// 换图：把任意图片覆盖到 assets/wallpaper.jpg（JPG/PNG/WebP/GIF 均可，格式自动识别），
// 然后重新运行 `node build.js`（或 pnpm build）。
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const imagePath = join(root, "assets", "wallpaper.jpg");
const templatePath = join(root, "src", "client.template.js");
const outPath = join(root, "lib", "client.js");

/** 按文件魔数识别图片 MIME（不依赖扩展名）。 */
function sniffMime(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (
    bytes.length >= 12 &&
    bytes.toString("latin1", 0, 4) === "RIFF" &&
    bytes.toString("latin1", 8, 12) === "WEBP"
  ) return "image/webp";
  if (bytes.length >= 6 && bytes.toString("latin1", 0, 6) === "GIF87a" || bytes.toString("latin1", 0, 6) === "GIF89a") return "image/gif";
  throw new Error(`unsupported image format in ${imagePath} — use JPEG/PNG/WebP/GIF`);
}

const image = readFileSync(imagePath);
const mime = sniffMime(image);
const base64 = image.toString("base64");
const template = readFileSync(templatePath, "utf8");

for (const placeholder of ["__WALLPAPER_MIME__", "__WALLPAPER_BASE64__"]) {
  if (!template.includes(placeholder)) throw new Error(`template is missing ${placeholder} placeholder`);
}

const output = template.replace("__WALLPAPER_MIME__", mime).replace("__WALLPAPER_BASE64__", base64);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, output);

console.log(`built ${outPath}`);
console.log(`  image: ${imagePath} (${image.length} bytes, ${mime})`);
console.log(`  bundle: ${Buffer.byteLength(output)} bytes (base64 ${base64.length})`);
