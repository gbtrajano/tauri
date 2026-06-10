// src/components/ProtectedRoute.tsx
// Agora funciona como layout completo com sidebar (padrão correto do React Router v6)
import { Navigate, Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute() {
  const { user, loading, logout } = useAuth()

  // Mostra spinner enquanto verifica sessão
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">🔧</div>
        <div className="loading-spinner" />
        <p>Carregando sistema...</p>
      </div>
    )
  }

  // Redireciona para login se não autenticado
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Layout completo: sidebar + conteúdo via Outlet
  return (
    <div className="app-container">
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🔧</div>
          <div className="sidebar-logo-text">
            <span className="name">AmigoMecânico</span>
            <span className="tagline">Sistema de Gestão</span>
          </div>
        </div>

        {/* Navegação */}
        <nav>
          <NavLink to="/dashboard" id="nav-dashboard">
            <span className="nav-icon">📊</span>Dashboard
          </NavLink>
          <NavLink to="/estoque" id="nav-estoque">
            <span className="nav-icon">📦</span>Estoque
          </NavLink>
          <NavLink to="/servicos" id="nav-servicos">
            <span className="nav-icon">🔧</span>Serviços
          </NavLink>
          <NavLink to="/orcamento" id="nav-orcamento">
            <span className="nav-icon">💰</span>Orçamento
          </NavLink>
          <NavLink to="/ordens" id="nav-ordens">
            <span className="nav-icon">📋</span>Ordens de Serviço
          </NavLink>
          <NavLink to="/clientes" id="nav-clientes">
            <span className="nav-icon">👥</span>Clientes
          </NavLink>
          <NavLink to="/veiculos" id="nav-veiculos">
            <span className="nav-icon">🚗</span>Veículos
          </NavLink>
          <NavLink to="/configuracoes" id="nav-configuracoes">
            <span className="nav-icon">⚙️</span>Configurações
          </NavLink>
        </nav>

        {/* Botão de logout no rodapé */}
        <div className="sidebar-footer">
          <button
            id="btn-logout"
            className="sidebar-logout"
            onClick={logout}
            title="Sair do sistema"
          >
            <span className="nav-icon">🚪</span>
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo da página atual */}
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
