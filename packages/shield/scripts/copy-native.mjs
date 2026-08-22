import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";

const ext = { win32: "dll", darwin: "dylib", linux: "so" }[
  process.platform
];
const release = path.resolve("native/target/release");
const source = path.join(release, `mine_shield.${ext}`);
const destination = path.join(release, "mine-shield.node");

if (!existsSync(source)) {
  console.error(`native library not found at ${source} — run cargo build --release first`);
  process.exit(1);
}
copyFileSync(source, destination);
console.log(`copied ${source} -> ${destination}`);
