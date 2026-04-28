pub mod args;
pub mod state;

pub use tauri_test_macros::{command, dispatch, setup};

use serde_json::Value;

/// Implemented by generated dispatchers.
pub trait Dispatcher {
    fn dispatch(command: &str, args: Value) -> Result<Value, String>;
}

/// Register test state once before invoking commands.
pub fn init_state<T: Send + Sync + 'static>(value: T) {
    state::register(value);
}

/// Run a dispatcher call.
pub fn invoke<D: Dispatcher>(cmd: String, args: Value) -> Result<Value, String> {
    D::dispatch(&cmd, args)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    struct OkDispatcher;
    struct ErrDispatcher;

    impl Dispatcher for OkDispatcher {
        fn dispatch(command: &str, args: Value) -> Result<Value, String> {
            Ok(json!({ "command": command, "args": args }))
        }
    }

    impl Dispatcher for ErrDispatcher {
        fn dispatch(command: &str, _args: Value) -> Result<Value, String> {
            Err(format!("unknown command: {command}"))
        }
    }

    #[test]
    fn invoke_returns_dispatcher_output() {
        let value = invoke::<OkDispatcher>("ping".into(), json!({ "count": 2 }))
            .expect("dispatcher should succeed");

        assert_eq!(
            value,
            json!({
                "command": "ping",
                "args": { "count": 2 }
            })
        );
    }

    #[test]
    fn invoke_propagates_dispatcher_errors() {
        let err = invoke::<ErrDispatcher>("missing".into(), json!({}))
            .expect_err("dispatcher should fail");

        assert_eq!(err, "unknown command: missing");
    }
}
