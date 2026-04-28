use serde::Serialize;
use std::sync::Mutex;

#[derive(Default)]
pub struct TodoDb {
    todos: Mutex<Vec<TodoRow>>,
}

#[derive(Clone)]
struct TodoRow {
    id: i64,
    title: String,
}

impl TodoDb {
    pub fn new() -> Self {
        Self::default()
    }
}

pub struct AppState {
    pub label: String,
}

#[derive(Serialize, Clone)]
pub struct Todo {
    pub id: i64,
    pub title: String,
}

fn init_test_state() -> (TodoDb, AppState) {
    (
        TodoDb::new(),
        AppState {
            label: "integration-test".into(),
        },
    )
}

#[tauri_test::setup(init = init_test_state)]
pub struct App;

#[tauri::command]
fn greet(name: String) -> String {
    format!("Hello, {name}! You've been greeted from Rust!")
}

#[tauri::command]
fn add_todo(title: String, db: tauri::State<'_, TodoDb>) -> Result<i64, String> {
    let mut todos = db.todos.lock().map_err(|e| e.to_string())?;
    let id = todos.len() as i64 + 1;
    todos.push(TodoRow { id, title });
    Ok(id)
}

#[tauri::command]
fn list_todos(db: tauri::State<'_, TodoDb>) -> Result<Vec<Todo>, String> {
    let todos = db.todos.lock().map_err(|e| e.to_string())?;
    Ok(todos
        .iter()
        .map(|row| Todo {
            id: row.id,
            title: row.title.clone(),
        })
        .collect())
}

#[tauri::command]
fn delete_todo(id: i64, db: tauri::State<'_, TodoDb>) -> Result<(), String> {
    let mut todos = db.todos.lock().map_err(|e| e.to_string())?;
    todos.retain(|row| row.id != id);
    Ok(())
}

#[tauri::command]
fn reset_todos(db: tauri::State<'_, TodoDb>) -> Result<(), String> {
    db.todos.lock().map_err(|e| e.to_string())?.clear();
    Ok(())
}

#[tauri::command]
fn get_app_state_label(app_state: tauri::State<'_, AppState>) -> String {
    app_state.label.clone()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(TodoDb::new())
        .manage(AppState {
            label: "desktop-app".into(),
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            add_todo,
            list_todos,
            delete_todo,
            reset_todos,
            get_app_state_label
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
