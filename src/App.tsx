// src/App.tsx
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Estoque from './pages/Estoque';
import OrdensServico from './pages/OrdensServico';
import Clientes from './pages/Clientes';
import Veiculos from './pages/Veiculos';
import Configuracoes from './pages/Configuracoes';
import Servicos from './pages/Servicos';
import Orcamento from './pages/Orcamento';
import { Login } from './pages/Login';
import { Activation } from './pages/Activation';
import { getDatabase } from './database';
import { check, Update } from '@tauri-apps/plugin-updater';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import './App.css';

function App() {
  // Verifica se o software já foi ativado (salvo no localStorage)
  const [activated, setActivated] = useState<boolean>(() => {
    return localStorage.getItem('amigo_activated') === 'true';
  });

  // Inicializa o banco de dados SQLite local
  useEffect(() => {
    getDatabase();
  }, []);

  // Verificador de atualizações (executa 5s após inicialização)
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
          }
        }
      } catch {
        // Falha silenciosa — não irrita o usuário com erros de rede
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // ─── Se não ativado, mostra SOMENTE a tela de ativação ───
  if (!activated) {
    return <Activation onActivated={() => setActivated(true)} />;
  }

  // ─── App principal após ativação ───
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rota pública de login */}
          <Route path="/login" element={<Login />} />

          {/* Layout protegido — inclui sidebar, redireciona se não autenticado */}
          <Route element={<ProtectedRoute />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/servicos" element={<Servicos />} />
            <Route path="/orcamento" element={<Orcamento />} />
            <Route path="/ordens" element={<OrdensServico />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/veiculos" element={<Veiculos />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
