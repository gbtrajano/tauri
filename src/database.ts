// src/database.ts
import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
    if (!db) {
        db = await Database.load('sqlite:oficina.db');
        await db.execute(`
      CREATE TABLE IF NOT EXISTS veiculos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        placa TEXT NOT NULL UNIQUE,
        marca TEXT,
        modelo TEXT,
        ano INTEGER,
        cor TEXT,
        cliente_id INTEGER,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
      );
      CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        telefone TEXT,
        email TEXT
      );
      CREATE TABLE IF NOT EXISTS pecas_estoque (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        codigo TEXT UNIQUE,
        descricao TEXT,
        quantidade INTEGER DEFAULT 0,
        preco_custo REAL,
        preco_venda REAL
      );
      CREATE TABLE IF NOT EXISTS ordens_servico (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        veiculo_id INTEGER,
        status TEXT DEFAULT 'aberta',
        descricao TEXT,
        data_abertura TEXT DEFAULT (datetime('now')),
        data_fechamento TEXT,
        FOREIGN KEY (veiculo_id) REFERENCES veiculos(id)
      );
      CREATE TABLE IF NOT EXISTS servicos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT,
        preco REAL
      );
      CREATE TABLE IF NOT EXISTS ordem_servico_itens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ordem_servico_id INTEGER NOT NULL,
        tipo TEXT NOT NULL, -- 'servico' or 'peca'
        item_id INTEGER NOT NULL,
        quantidade INTEGER NOT NULL DEFAULT 1,
        preco_unitario REAL NOT NULL,
        FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico(id)
      );
    `);
    }
    // Ensure nome column exists in pecas_estoque (for existing databases)
    try {
        await db.execute('ALTER TABLE pecas_estoque ADD COLUMN nome TEXT NOT NULL DEFAULT ""');
    } catch (e) {
        // Ignore error if column already exists
        if (e !== null && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
            if (e.message.includes('duplicate column')) {
                // Column already exists, ignore
            } else {
                console.error('Failed to add nome column to pecas_estoque:', e);
            }
        } else {
            console.error('Failed to add nome column to pecas_estoque:', e);
        }
    }
    return db;
}