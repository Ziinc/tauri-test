# TauriTest Example

This example shows the README-first `tauri-test` flow:

- plain `#[tauri::command]` functions are exposed to tests automatically
- Rust command logic runs through a real N-API bridge
- Vitest + JSDOM drive the React UI
- `@tauri-apps/api/core` is mocked to call the generated addon in `src-tauri/target`

## Run

From this directory:

```bash
npm test
```

That command will:

1. compile the `src-tauri` crate
2. generate a loader in `src-tauri/target`
3. run the Vitest suite

## Relevant files

- `src-tauri/src/lib.rs`: plain Tauri commands plus `#[tauri_test::setup]`
- `tests/setup.ts`: addon loading and `invoke` mock wiring
- `tests/app.test.tsx`: UI-driven and direct-command integration tests
