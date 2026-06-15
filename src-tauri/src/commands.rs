// src-tauri/src/commands.rs
use std::fs;
use tauri::AppHandle;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;
use tokio::sync::oneshot;

#[derive(serde::Serialize)]
#[allow(dead_code)]
pub struct AppInfo {
    name: String,
    version: String,
}

#[tauri::command]
#[allow(dead_code)]
pub async fn export_database(app: AppHandle) -> Result<String, String> {
    let db_path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("oficina.db");

    let (tx, rx) = oneshot::channel();

    app.dialog()
        .file()
        .set_title("Exportar banco de dados")
        .add_filter("SQLite Database", &["db"])
        .save_file(move |file_path| {
            let _ = tx.send(file_path);
        });

    let file_path = rx
        .await
        .map_err(|_| "Erro no canal")?
        .ok_or("Diálogo cancelado")?;

    // Converte FilePath para PathBuf
    let dest_path = file_path.into_path().map_err(|_| "Caminho inválido")?;

    fs::copy(&db_path, &dest_path).map_err(|e| e.to_string())?;
    Ok(dest_path.display().to_string())
}

#[tauri::command]
#[allow(dead_code)]
pub async fn import_database(app: AppHandle) -> Result<(), String> {
    let (tx, rx) = oneshot::channel();

    app.dialog()
        .file()
        .set_title("Importar banco de dados")
        .add_filter("SQLite Database", &["db"])
        .pick_file(move |file_path| {
            let _ = tx.send(file_path);
        });

    let file_path = rx
        .await
        .map_err(|_| "Erro no canal")?
        .ok_or("Diálogo cancelado")?;

    let src_path = file_path.into_path().map_err(|_| "Caminho inválido")?;

    let db_path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("oficina.db");

    fs::copy(&src_path, &db_path).map_err(|e| e.to_string())?;

    app.restart();
}

#[tauri::command]
#[allow(dead_code)]
pub fn app_info() -> Result<AppInfo, String> {
    Ok(AppInfo {
        name: env!("CARGO_PKG_NAME").to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}