import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { setupTauriNapi } from "../dist/index.js";

const require = createRequire(import.meta.url);
const loadNodeModule = require.extensions[".node"];

test.before(() => {
  require.extensions[".node"] = require.extensions[".js"];
});

test.after(() => {
  require.extensions[".node"] = loadNodeModule;
});

test("throws when the addon directory is missing", () => {
  assert.throws(
    () => setupTauriNapi({ addonPath: path.join(process.cwd(), "missing-addon") }),
    /cannot read directory/,
  );
});

test("throws when the addon directory has no .node file", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tauri-test-empty-"));

  assert.throws(() => setupTauriNapi({ addonPath: dir }), /no \.node file found/);
});

test("loads the addon, runs init, and dispatches invoke", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tauri-test-addon-"));
  const addonPath = path.join(dir, "fake.node");

  fs.writeFileSync(
    addonPath,
    [
      "let initCalls = 0;",
      "module.exports = {",
      "  init() { initCalls += 1; },",
      "  getInitCalls() { return initCalls; },",
      "  async invoke(cmd, args) { return { cmd, args, initCalls }; }",
      "};",
    ].join("\n"),
  );

  const handle = setupTauriNapi({
    addonPath: dir,
    init: (napi) => {
      napi.init?.();
      return { ready: true };
    },
  });

  assert.equal(handle.state.ready, true);
  assert.equal(handle.napi.getInitCalls(), 1);
  assert.deepEqual(await handle.invoke("ping", { count: 2 }), {
    cmd: "ping",
    args: { count: 2 },
    initCalls: 1,
  });
});

test("wraps non-Error invoke rejections", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tauri-test-error-"));
  const addonPath = path.join(dir, "reject.node");

  fs.writeFileSync(
    addonPath,
    [
      "module.exports = {",
      "  async invoke() { throw 'boom'; }",
      "};",
    ].join("\n"),
  );

  const handle = setupTauriNapi({ addonPath: dir });

  await assert.rejects(handle.invoke("ping"), /boom/);
});
