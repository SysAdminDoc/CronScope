import { copyFile, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");

await rm(dist, { recursive:true, force:true });
await mkdir(dist, { recursive:true });

await copyFile(join(root, "index.html"), join(dist, "cronscope.html"));
await copyFile(join(root, "index.html"), join(dist, "index.html"));
await copyFile(join(root, "manifest.webmanifest"), join(dist, "manifest.webmanifest"));
await copyFile(join(root, "sw.js"), join(dist, "sw.js"));
await copyFile(join(root, "cronscope-core.js"), join(dist, "cronscope-core.js"));

console.log("Built dist/cronscope.html");
