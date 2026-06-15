#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows")
]

mod commands;

#[allow(dead_code)]
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build()) // <--- LINHA ADICIONADA AQUI
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            commands::export_database,
            commands::import_database
        ])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar a aplicação")
}