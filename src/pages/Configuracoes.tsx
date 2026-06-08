// src/pages/Configuracoes.tsx
import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';
import './pages.css';

const Configuracoes = () => {
    const [mensagem, setMensagem] = useState('');

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

            {mensagem && (
                <div className="mensagem-feedback">
                    {mensagem}
                </div>
            )}
        </div>
    );
};

export default Configuracoes;