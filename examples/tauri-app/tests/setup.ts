import { createRequire } from "node:module";
import { vi } from "vitest";
import "@testing-library/jest-dom";

const require = createRequire(import.meta.url);

export const tauriTest = require("../src-tauri/target") as {
  invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
};

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (cmd: string, args?: Record<string, unknown>) =>
    tauriTest.invoke(cmd, args ?? {}),
}));
