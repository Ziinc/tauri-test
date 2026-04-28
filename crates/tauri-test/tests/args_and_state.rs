use serde_json::json;

#[test]
fn reads_required_and_optional_args() {
    let args = json!({
        "title": "Write tests",
        "count": 3
    });

    assert_eq!(
        tauri_test::args::get_str(&args, "title").expect("title should exist"),
        "Write tests"
    );
    assert_eq!(
        tauri_test::args::get_i64(&args, "count").expect("count should exist"),
        3
    );
    assert_eq!(tauri_test::args::opt_str(&args, "title").as_deref(), Some("Write tests"));
    assert_eq!(tauri_test::args::opt_i64(&args, "count"), Some(3));
}

#[test]
fn returns_clear_errors_for_missing_or_invalid_args() {
    let args = json!({
        "title": 10
    });

    assert_eq!(
        tauri_test::args::get_str(&args, "title").expect_err("title should be invalid"),
        "Missing or invalid argument: title"
    );
    assert_eq!(
        tauri_test::args::get_i64(&args, "count").expect_err("count should be missing"),
        "Missing or invalid argument: count"
    );
}

#[test]
fn stores_and_reads_registered_state() {
    tauri_test::init_state::<String>("ready".into());

    let value = tauri_test::state::get::<String>().expect("state should be registered");

    assert_eq!(value.as_str(), "ready");
}

#[test]
fn converts_optional_string_to_json_value() {
    assert_eq!(tauri_test::args::opt_str_to_value(Some("hello".into())), json!("hello"));
    assert_eq!(tauri_test::args::opt_str_to_value(None), serde_json::Value::Null);
}
