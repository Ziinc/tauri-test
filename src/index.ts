import { createRequire } from "module";
import path from "path";
import fs from "fs";

export interface TauriNapiOptions<TState = void> {
  /** Absolute path to the napi crate directory or the built .node file. */
  addonPath: string;
  /** Optional setup callback for seeding addon state. */
  init?: (napi: NapiAddon) => TState;
}

export interface NapiAddon {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  invoke?: (cmd: string, args: Record<string, unknown>) => Promise<unknown>;
  init?: () => void;
}

export interface TauriNapiHandle<TState = void> {
  /** The raw napi module. Access exports like napi.init(). */
  napi: NapiAddon;
  /** Stored setup state returned by init, if provided. */
  state: TState;
  /** Always dispatches through the addon async invoke export. */
  invoke(cmd: string, args?: Record<string, unknown>): Promise<unknown>;
}

function resolveAddon(addonPath: string): string {
  if (addonPath.endsWith(".node")) return addonPath;

  // Find the first .node file in the directory.
  let files: string[];
  try {
    files = fs.readdirSync(addonPath).filter((f: string) => f.endsWith(".node"));
  } catch {
    throw new Error(
      `tauri-test: cannot read directory "${addonPath}". ` +
        `Run \`npm run build:napi\` in your Tauri app first.`,
    );
  }
  if (files.length === 0) {
    throw new Error(
      `tauri-test: no .node file found in "${addonPath}". ` +
        `Run \`npm run build:napi\` in your Tauri app first.`,
    );
  }
  return path.join(addonPath, files[0]);
}

/**
 * Load the napi addon and return a handle for wiring into your vitest setup.
 *
 * Usage in vitest.setup.ts:
 *
 *   import { setupTauriNapi } from "tauri-test";
 *
 *   export const handle = setupTauriNapi({
 *     addonPath: "./src-tauri",
 *     init: (napi) => {
 *       napi.init?.();
 *       return { resetState: () => napi.init?.() };
 *     },
 *   });
 */
export function setupTauriNapi<TState = void>(
  options: TauriNapiOptions<TState>,
): TauriNapiHandle<TState> {
  const { addonPath, init } = options;

  const req = createRequire(path.join(process.cwd(), "__tauri_test_loader__.cjs"));
  const nodePath = resolveAddon(addonPath);
  const napi: NapiAddon = req(nodePath);
  const handle: TauriNapiHandle<TState> = {
    napi,
    state: undefined as TState,
    invoke(
      cmd: string,
      args: Record<string, unknown> = {},
    ): Promise<unknown> {
      if (!napi.invoke) {
        return Promise.reject(
          new Error(`tauri-test: addon exports no invoke`),
        );
      }
      return napi.invoke(cmd, args).catch((err: unknown) => {
        return Promise.reject(
          err instanceof Error ? err : new Error(String(err)),
        );
      });
    },
  };

  if (init) {
    handle.state = init(napi);
  }

  return handle;
}
