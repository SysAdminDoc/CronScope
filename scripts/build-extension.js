import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const extension = join(root, "vscode-extension");
await mkdir(extension, { recursive:true });
await copyFile(join(root, "cronscope-core.js"), join(extension, "core.js"));
console.log("Prepared vscode-extension/core.js");
