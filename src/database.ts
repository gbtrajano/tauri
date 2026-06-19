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
        preco_venda REAL,
        estoque_minimo INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS ordens_servico (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        veiculo_id INTEGER,
        status TEXT DEFAULT 'aberta',
        descricao TEXT,
        valor_estimado REAL DEFAULT 0,
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
      CREATE TABLE IF NOT EXISTS oficina_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        cnpj TEXT,
        endereco TEXT,
        contato TEXT
      );
    `);
    }
    // Migrations for existing databases
    const migrations = [
        'ALTER TABLE pecas_estoque ADD COLUMN nome TEXT NOT NULL DEFAULT ""',
        'ALTER TABLE pecas_estoque ADD COLUMN estoque_minimo INTEGER DEFAULT 0',
        'ALTER TABLE ordens_servico ADD COLUMN valor_estimado REAL DEFAULT 0',
        'ALTER TABLE clientes ADD COLUMN cpf_cnpj TEXT DEFAULT ""',
        'ALTER TABLE veiculos ADD COLUMN chassi TEXT DEFAULT ""',
        'ALTER TABLE veiculos ADD COLUMN quilometragem INTEGER DEFAULT 0',
        'ALTER TABLE ordens_servico ADD COLUMN nivel_combustivel TEXT DEFAULT ""',
        'ALTER TABLE ordens_servico ADD COLUMN estado_visual TEXT DEFAULT ""',
        'ALTER TABLE ordens_servico ADD COLUMN pertences_deixados TEXT DEFAULT ""',
        'ALTER TABLE ordens_servico ADD COLUMN diagnostico_tecnico TEXT DEFAULT ""',
        'ALTER TABLE ordens_servico ADD COLUMN previsao_entrega TEXT DEFAULT ""',
    ];
    for (const sql of migrations) {
        try {
            await db.execute(sql);
        } catch (e: any) {
            // Ignore 'duplicate column' errors — column already exists
            if (!e?.message?.includes('duplicate column')) {
                console.warn('Migration warning:', e);
            }
        }
    }
    return db;
}