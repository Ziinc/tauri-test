use serde_json::Value;

pub fn get_str(args: &Value, key: &str) -> Result<String, String> {
    args.get(key)
        .and_then(|v| v.as_str())
        .map(String::from)
        .ok_or_else(|| format!("Missing or invalid argument: {key}"))
}

pub fn get_i64(args: &Value, key: &str) -> Result<i64, String> {
    args.get(key)
        .and_then(|v| v.as_i64())
        .ok_or_else(|| format!("Missing or invalid argument: {key}"))
}

pub fn opt_i64(args: &Value, key: &str) -> Option<i64> {
    args.get(key).and_then(|v| v.as_i64())
}

pub fn opt_str(args: &Value, key: &str) -> Option<String> {
    args.get(key).and_then(|v| v.as_str()).map(String::from)
}

pub fn opt_str_to_value(s: Option<String>) -> Value {
    s.map(Value::String).unwrap_or(Value::Null)
}
