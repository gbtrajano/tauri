// src/pages/Activation.tsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import '../App.css'

interface ActivationProps {
  onActivated: () => void
}

export function Activation({ onActivated }: ActivationProps) {
  const [key, setKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Auto-formata a chave como XXXX-XXXX-XXXX-XXXX enquanto digita
  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    const groups = raw.match(/.{1,4}/g) ?? []
    setKey(groups.slice(0, 4).join('-'))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const normalized = key.trim().toUpperCase()

    try {
      // Busca a chave na tabela 'activation_keys' no Supabase
      const { data, error: sbError } = await supabase
        .from('activation_keys')
        .select('*')
        .eq('key', normalized)
        .single()

      if (sbError || !data) {
        setError('Chave de ativação inválida. Verifique os caracteres e tente novamente.')
        setLoading(false)
        return
      }

      // Opcional: Se houver uma coluna "is_active" ou "status"
      if (data.is_active === false) {
        setError('Esta chave já foi utilizada ou está desativada.')
        setLoading(false)
        return
      }

      setSuccess(true)
      localStorage.setItem('amigo_activated', 'true')
      await new Promise(r => setTimeout(r, 1000))
      onActivated()
    } catch (err) {
      console.error(err)
      setError('Erro ao comunicar com o servidor de ativação. Tente novamente mais tarde.')
      setLoading(false)
    }
  }

  const isKeyComplete = key.length === 19 // XXXX-XXXX-XXXX-XXXX = 19 chars

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🔐</div>
          <h1>AmigoMecânico</h1>
          <p>Sistema de Gestão para Oficinas</p>
        </div>

        {success ? (
          /* Feedback de sucesso */
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ color: '#6ee7b7', fontWeight: 600, fontSize: 16 }}>
              Software ativado com sucesso!
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>
              Redirecionando para o sistema...
            </p>
          </div>
        ) : (
          <>
            <h2 className="auth-title">Ativação do Software</h2>
            <p className="auth-subtitle">
              Insira a chave de licença fornecida para ativar o AmigoMecânico.
            </p>

            {error && (
              <div className="auth-error" style={{ marginBottom: 14 }}>
                ⚠️ {error}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label>Chave de Licença</label>
                <input
                  id="activation-key"
                  type="text"
                  className="key-input"
                  value={key}
                  onChange={handleKeyChange}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  maxLength={19}
                  required
                  disabled={loading}
                  autoComplete="off"
                  spellCheck={false}
                  autoFocus
                />
                <span className="key-hint">
                  {isKeyComplete
                    ? '✓ Chave completa — clique em Ativar'
                    : `${key.replace(/-/g, '').length}/16 caracteres`}
                </span>
              </div>

              <button
                type="submit"
                id="btn-activate"
                className="auth-btn"
                disabled={loading || !isKeyComplete}
              >
                {loading ? '🔄 Verificando chave...' : '🔓 Ativar Software'}
              </button>
            </form>

            <p className="auth-footer-note">
              Não possui uma chave?<br />
              Entre em contato com o suporte para adquirir sua licença.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
