// src/pages/Configuracoes.tsx
import { invoke } from '@tauri-apps/api/core';
import { useState, useEffect } from 'react';
import './pages.css';

interface AppInfo {
  name: string;
  version: string;
}

const Configuracoes = () => {
    const [mensagem, setMensagem] = useState('');
    const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

    useEffect(() => {
        invoke<AppInfo>('app_info')
            .then(setAppInfo)
            .catch(console.error);
    }, []);

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

            <div className="config-botoes">
                <button className="botao-config" onClick={exportar}>
                    Exportar banco de dados
                </button>
                <button className="botao-config" onClick={importar}>
                    Importar banco de dados
                </button>
            </div>

            {appInfo && (
                <div className="sobre-sistema">
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