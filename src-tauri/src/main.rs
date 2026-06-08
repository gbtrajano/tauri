// src-tauri/src/main.rs
mod commands;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::export_database,
            commands::import_database
        ])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar a aplicação");
}
