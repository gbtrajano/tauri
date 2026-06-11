// src/pages/Login.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activationKey, setActivationKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login, signUp, user, loading: authLoading } = useAuth();

  // Redireciona se já estiver autenticado
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (isRegister && password !== confirmPassword) {
      setError("As senhas não coincidem. Verifique e tente novamente.");
      return;
    }

    if (isRegister && activationKey.length !== 19) {
      setError("A chave de acesso deve estar completa (16 caracteres).");
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        await signUp(email, password, activationKey.toUpperCase());
        setSuccessMsg("Cadastro realizado com sucesso! Redirecionando...");
      } else {
        await login(email, password);
        navigate("/dashboard", { replace: true });
      }
    } catch (err: any) {
      setError(
        err.message ||
          "Credenciais inválidas ou erro no servidor. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🔧</div>
          <h1>AmigoMecânico</h1>
          <p>Sistema de Gestão para Oficinas</p>
        </div>

        <h2 className="auth-title">
          {isForgotPassword
            ? "Recuperar Senha"
            : isRegister
              ? "Criar sua conta"
              : "Entrar no sistema"}
        </h2>
        <p className="auth-subtitle">
          {isForgotPassword
            ? "Siga as instruções abaixo para recuperar seu acesso"
            : isRegister
              ? "Preencha os dados abaixo para se cadastrar no sistema"
              : "Insira suas credenciais para acessar o painel"}
        </p>

        {error && (
          <div className="auth-error" style={{ marginBottom: 14 }}>
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              marginBottom: 14,
              color: "#16a34a",
              background: "rgba(22,163,74,0.1)",
              padding: 12,
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            {successMsg}
          </div>
        )}

        {isForgotPassword ? (
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-muted)",
                lineHeight: "1.5",
                marginBottom: 16,
              }}
            >
              Para garantir a segurança dos seus dados, a recuperação de senha é
              feita manualmente pelo nosso suporte.
            </p>
            <p
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "#fff",
                marginBottom: 16,
              }}
            >
              Envie um e-mail para:
              <br />
              <span
                style={{
                  color: "var(--brand)",
                  fontSize: 18,
                  fontWeight: "bold",
                }}
              >
                contatosupplysistemas@gmail.com
              </span>
            </p>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-muted)",
                lineHeight: "1.5",
              }}
            >
              Deixando claro qual é a sua <strong>Chave de Acesso</strong> (a
              mesma que foi informada no chat do Mercado Livre no momento da
              compra).
            </p>

            <button
              type="button"
              className="auth-btn"
              style={{ marginTop: 24, background: "#374151" }}
              onClick={() => setIsForgotPassword(false)}
            >
              ← Voltar para o Login
            </button>
          </div>
        ) : (
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
                autoComplete={isRegister ? "new-password" : "current-password"}
              />
            </div>

            {isRegister && (
              <>
                <div className="form-field">
                  <label htmlFor="login-confirm-password">
                    Confirmar Senha
                  </label>
                  <input
                    id="login-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required={isRegister}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="activation-key">Chave de Acesso</label>
                  <input
                    id="activation-key"
                    type="text"
                    className="key-input"
                    style={{
                      textTransform: "uppercase",
                      letterSpacing: "2px",
                      textAlign: "center",
                      fontFamily: "monospace",
                    }}
                    value={activationKey}
                    onChange={(e) => {
                      const raw = e.target.value
                        .replace(/[^A-Za-z0-9]/g, "")
                        .toUpperCase();
                      const groups = raw.match(/.{1,4}/g) ?? [];
                      setActivationKey(groups.slice(0, 4).join("-"));
                    }}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    maxLength={19}
                    required={isRegister}
                    disabled={loading}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <span
                    className="key-hint"
                    style={{
                      display: "block",
                      textAlign: "right",
                      fontSize: 12,
                      marginTop: 4,
                      color: "var(--text-muted)",
                    }}
                  >
                    {activationKey.length === 19
                      ? "✓ Chave completa"
                      : `${activationKey.replace(/-/g, "").length}/16 caracteres`}
                  </span>
                </div>
              </>
            )}

            <button
              id="btn-login"
              type="submit"
              className="auth-btn"
              disabled={loading}
            >
              {loading
                ? isRegister
                  ? "🔄 Cadastrando..."
                  : "🔄 Entrando..."
                : isRegister
                  ? "Cadastrar e Entrar →"
                  : "Entrar →"}
            </button>
          </form>
        )}

        {!isForgotPassword && (
          <div style={{ marginTop: 20, textAlign: "center" }}>
            {!isRegister && (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(true);
                  setError(null);
                  setSuccessMsg(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 13,
                  textDecoration: "underline",
                  marginBottom: 16,
                }}
              >
                Esqueci minha senha
              </button>
            )}

            <p className="auth-footer-note" style={{ margin: 0 }}>
              {isRegister
                ? "Já possui uma conta?"
                : "Ainda não possui uma conta?"}
              <br />
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                  setSuccessMsg(null);
                  setPassword("");
                  setConfirmPassword("");
                  setActivationKey("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--brand)",
                  cursor: "pointer",
                  fontWeight: 600,
                  padding: "4px 8px",
                  marginTop: "4px",
                }}
              >
                {isRegister ? "Faça login aqui" : "Cadastre-se agora"}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
