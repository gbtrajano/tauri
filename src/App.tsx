// src/App.tsx
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Estoque from './pages/Estoque';
import OrdensServico from './pages/OrdensServico';
import Clientes from './pages/Clientes';
import Veiculos from './pages/Veiculos';
import Configuracoes from './pages/Configuracoes';
import Servicos from './pages/Servicos';
import Orcamento from './pages/Orcamento';
import { getDatabase } from './database';
import { check, Update } from '@tauri-apps/plugin-updater';
import './App.css';

function App() {
  // Inicializa o banco de dados e cria as tabelas (caso não existam)
  useEffect(() => {
    getDatabase();
  }, []);

  // ✅ NOVO: Verificador de atualização (executa uma vez após 5s de inicialização)
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const manifest: Update | null = await check();

        if (manifest !== null) {
          const resposta = window.confirm(
            `🚀 Nova versão disponível: ${manifest.version}\n\n${manifest.body}\n\nDeseja atualizar agora?`
          );
          
          if (resposta) {
            await manifest.downloadAndInstall();
            // O Tauri reinicia o app automaticamente após instalação
          }
        }
      } catch (err) {
        // Falha silenciosa - não queremos irritar o usuário com erros de rede ocasionais
        // Descomente a linha abaixo apenas se quiser depurar durante desenvolvimento:
        // console.debug('Update check failed:', err);
      }
    }, 5000); // 5 segundos após o app iniciar

    return () => clearTimeout(timer);
  }, []); // Array vazio = roda apenas uma vez no mount

  return (
    <BrowserRouter>
      <div className="app-container">
        <aside className="sidebar">
          <h2>AmigoMecânico</h2>
          <nav>
            <NavLink to="/dashboard">📊 Dashboard</NavLink>
            <NavLink to="/estoque">📦 Estoque</NavLink>
            <NavLink to="/servicos">🔧 Serviços</NavLink>
            <NavLink to="/orcamento">💰 Orçamento</NavLink>
            <NavLink to="/ordens">📋 Ordens de Serviço</NavLink>
            <NavLink to="/clientes">👥 Clientes</NavLink>
            <NavLink to="/veiculos">🚗 Veículos</NavLink>
            <NavLink to="/configuracoes">⚙️ Configurações</NavLink>
          </nav>
        </aside>
        <main className="content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/servicos" element={<Servicos />} />
            <Route path="/orcamento" element={<Orcamento />} />
            <Route path="/ordens" element={<OrdensServico />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/veiculos" element={<Veiculos />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;