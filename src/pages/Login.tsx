// src/pages/Login.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login, user, loading: authLoading } = useAuth()

  // Redireciona se já estiver autenticado
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, authLoading, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Credenciais inválidas. Verifique e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🔧</div>
          <h1>AmigoMecânico</h1>
          <p>Sistema de Gestão para Oficinas</p>
        </div>

        <h2 className="auth-title">Entrar no sistema</h2>
        <p className="auth-subtitle">Insira suas credenciais para acessar o painel</p>

        {error && (
          <div className="auth-error" style={{ marginBottom: 14 }}>
            ⚠️ {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              disabled={loading}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-field">
            <label htmlFor="login-password">Senha</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            id="btn-login"
            type="submit"
            className="auth-btn"
            disabled={loading}
          >
            {loading ? '🔄 Entrando...' : 'Entrar →'}
          </button>
        </form>
      </div>
    </div>
  )
}
