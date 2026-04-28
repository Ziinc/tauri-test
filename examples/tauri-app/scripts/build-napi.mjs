import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(appDir, "../..");
const crateManifest = path.join(appDir, "src-tauri", "Cargo.toml");
const addonDir = path.join(appDir, "src-tauri");

const dylibExt = (() => {
  switch (process.platform) {
    case "win32":
      return "dll";
    case "darwin":
      return "dylib";
    default:
      return "so";
  }
})();

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      env: {
        ...process.env,
        RUSTC_WRAPPER: "",
      },
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`));
    });
  });
}

async function main() {
  await run(
    "cargo",
    [
      "rustc",
      "--manifest-path",
      crateManifest,
      "--release",
      "--lib",
      "--crate-type",
      "cdylib",
    ],
    repoRoot,
  );

  const artifact = path.join(repoRoot, "target", "release", `libtauri_app_lib.${dylibExt}`);
  const addonPath = path.join(addonDir, "tauri-app.node");
  const existing = await fs.readdir(addonDir);

  await Promise.all(
    existing
      .filter((file) => file.endsWith(".node"))
      .map((file) => fs.rm(path.join(addonDir, file))),
  );
  await fs.copyFile(artifact, addonPath);
}

await main();
