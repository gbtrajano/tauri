// src/pages/Configuracoes.tsx
import { invoke } from '@tauri-apps/api/core';
import { useState, useEffect, FormEvent } from 'react';
import { getDatabase } from '../database';
import './pages.css';

interface AppInfo {
  name: string;
  version: string;
}

interface OficinaConfig {
  id: number;
  nome: string;
  cnpj: string;
  endereco: string;
  contato: string;
}

const Configuracoes = () => {
    const [mensagem, setMensagem] = useState('');
    const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

    // Oficina state
    const [configId, setConfigId] = useState<number | null>(null);
    const [nome, setNome] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [endereco, setEndereco] = useState('');
    const [contato, setContato] = useState('');

    const carregarConfig = async () => {
        try {
            const db = await getDatabase();
            const rows = await db.select<OficinaConfig[]>('SELECT * FROM oficina_config LIMIT 1');
            if (rows.length > 0) {
                const conf = rows[0];
                setConfigId(conf.id);
                setNome(conf.nome || '');
                setCnpj(conf.cnpj || '');
                setEndereco(conf.endereco || '');
                setContato(conf.contato || '');
            }
        } catch (e) {
            console.error("Erro ao carregar configurações da oficina", e);
        }
    };

    useEffect(() => {
        invoke<AppInfo>('app_info')
            .then(setAppInfo)
            .catch(console.error);
        carregarConfig();
    }, []);

    const salvarConfigOficina = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const db = await getDatabase();
            if (configId) {
                await db.execute(
                    'UPDATE oficina_config SET nome = ?, cnpj = ?, endereco = ?, contato = ? WHERE id = ?',
                    [nome, cnpj, endereco, contato, configId]
                );
            } else {
                await db.execute(
                    'INSERT INTO oficina_config (nome, cnpj, endereco, contato) VALUES (?, ?, ?, ?)',
                    [nome, cnpj, endereco, contato]
                );
            }
            setMensagem('✅ Dados da oficina salvos com sucesso!');
            carregarConfig();
            setTimeout(() => setMensagem(''), 3000);
        } catch (e: any) {
            setMensagem(`❌ Erro ao salvar: ${e.message}`);
        }
    };

    const exportar = async () => {
        try {
            const path = await invoke<string>('export_database');
            setMensagem(`✅ Banco exportado para: ${path}`);
        } catch (e) {
            setMensagem(`❌ Erro: ${e}`);
        }
    };

    const importar = async () => {
        try {
            await invoke('import_database');
            setMensagem('📥 Banco importado com sucesso! Reiniciando...');
        } catch (e) {
            setMensagem(`❌ Erro: ${e}`);
        }
    };

    return (
        <div className="pagina-container">
            <h1>⚙️ Configurações</h1>

            <div className="dados-oficina-container">
                <h2>Dados da Oficina</h2>
                <form onSubmit={salvarConfigOficina} className="form-cadastro">
                    <input placeholder="Nome da Oficina" value={nome} onChange={e => setNome(e.target.value)} required />
                    <input placeholder="CNPJ" value={cnpj} onChange={e => setCnpj(e.target.value)} />
                    <input placeholder="Endereço Completo" value={endereco} onChange={e => setEndereco(e.target.value)} />
                    <input placeholder="Contato (Telefone/Email)" value={contato} onChange={e => setContato(e.target.value)} />
                    <button type="submit">💾 Salvar Dados da Oficina</button>
                </form>
            </div>

            <hr style={{ margin: '30px 0', borderColor: '#eee' }} />

            <h2>Banco de Dados</h2>
            <div className="config-botoes">
                <button className="botao-config" onClick={exportar}>
                    Exportar banco de dados
                </button>
                <button className="botao-config" onClick={importar}>
                    Importar banco de dados
                </button>
            </div>

            {appInfo && (
                <div className="sobre-sistema" style={{ marginTop: '30px' }}>
                    <h2>Sobre o Sistema</h2>
                    <p><strong>Nome:</strong> {appInfo.name}</p>
                    <p><strong>Versão:</strong> {appInfo.version}</p>
                </div>
            )}

            {mensagem && (
                <div className="mensagem-feedback">
                    {mensagem}
                </div>
            )}
        </div>
    );
};

export default Configuracoes;