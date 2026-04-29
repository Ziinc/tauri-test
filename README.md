# TauriTest

A UI integration testing library for Tauri, that exposes Tauri commands to JSdom via N-API bridge, allowing full JS-driven integration testing against application UI and Rust source code.

## Getting Started


In your Tauri app crate, add `tauri-test`:

```toml
[lib]
crate-type = ["cdylib", "rlib", "staticlib"]

[build-dependencies]
napi-build = "2"

[dependencies]
tauri = { version = "2", features = [] }
tauri-test = "0.1.0"
napi = { version = "2", default-features = false, features = ["napi8", "async", "serde-json"] }
napi-derive = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

Use `napi_build::setup()` in `build.rs`:

```rust
fn main() {
    napi_build::setup();
    tauri_build::build();
}
```

Tauri commands will automatically get `invoke(...)`:

```rust
// optionally declare init function to define application state for invoke commands
#[tauri_test::setup(init = init_test_state)]
pub struct App;

// optional
fn init_test_state() -> TodoDb {
    // initialize rust app state
    TodoDb::new()
}

#[tauri::command]
fn greet(name: String) -> String {
    format!("Hello, {name}! You've been greeted from Rust!")
}
```
Build the `src-tauri` library to generate the addon loader:

```json
{
  "devDependencies": {
    "vitest": "^3.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jsdom": "^26.0.0"
  },
  "scripts": {
    "pretest": "cd src-tauri && cargo build --lib",
    "test": "vitest run"
  }
}
```

In `tests/setup.ts`, load the compiled addon and register a Vitest mock for `@tauri-apps/api/core`:

```ts
import { createRequire } from "node:module";
import { vi } from "vitest";

const require = createRequire(import.meta.url);
const tauriTest = require("../src-tauri/target");

vi.mock("@tauri-apps/api/core", () => ({
  invoke: tauriTest.invoke
}));
```

Write a real integration test:

```ts
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";

it("greets through real Rust", async () => {
  render(<App />);

  await userEvent.type(screen.getByPlaceholderText("Enter a name..."), "World");
  await userEvent.click(screen.getByRole("button", { name: /greet/i }));

  await waitFor(() => {
    expect(screen.getByText(/hello from rust/i)).toBeInTheDocument();
  });
});
```

## Publishing

This repository publishes two crates:

- `tauri-test-macros` is the implementation crate for the procedural macros.
- `tauri-test` is the public crate that re-exports those macros and the runtime API.

The publish workflow releases `tauri-test-macros` first, waits for it to appear in the crates.io index, and then publishes `tauri-test`.
