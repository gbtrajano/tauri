import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, activationKey: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    // Busca sessão inicial — com fallback em caso de erro de rede
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null)
      })
      .catch(() => {
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })

    // Escuta mudanças de auth (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, activationKey: string) => {
    // 1. Validar a chave de acesso no Supabase
    const { data: keyData, error: keyError } = await supabase
      .from('activation_keys')
      .select('*')
      .eq('key', activationKey)
      .single()

    if (keyError || !keyData) {
      throw new Error('Chave de acesso inválida ou não encontrada.')
    }
    if (!keyData.is_active) {
      throw new Error('Esta chave de acesso já foi utilizada por outra conta ou está bloqueada.')
    }

    // 2. Criar a conta de usuário
    const { error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) throw signUpError

    // 3. Consumir a chave (marcar como inativa para não ser reutilizada e atrelar ao email)
    const { error: updateError } = await supabase
      .from('activation_keys')
      .update({ is_active: false, user_email: email })
      .eq('key', activationKey)
      
    if (updateError) {
      console.error('Aviso: Conta criada, mas falhou ao desativar a chave:', updateError)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  // ✅ Sem early return! Deixa o ProtectedRoute tratar o estado de loading
  return (
    <AuthContext.Provider value={{ user, loading, login, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
