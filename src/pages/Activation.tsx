// src/pages/Activation.tsx
import { useState } from 'react'
import '../App.css'

// =====================================================
// CHAVES DE ATIVAÇÃO VÁLIDAS
// Adicione as chaves dos seus clientes aqui.
// Formato: XXXX-XXXX-XXXX-XXXX (maiúsculas)
// =====================================================
const VALID_KEYS: string[] = [
  'AMIGO-2024-MECA-PRO1',
  'AMIGO-2024-MECA-PRO2',
  'AMIGO-2024-MECA-PRO3',
  'AMIGO-DEMO-TEST-0001',
]

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

    // Simula uma verificação (800ms) para não parecer instantâneo
    await new Promise(r => setTimeout(r, 800))

    const normalized = key.trim().toUpperCase()

    if (VALID_KEYS.includes(normalized)) {
      setSuccess(true)
      localStorage.setItem('amigo_activated', 'true')
      await new Promise(r => setTimeout(r, 1000))
      onActivated()
    } else {
      setError('Chave de ativação inválida. Verifique os caracteres e tente novamente.')
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
