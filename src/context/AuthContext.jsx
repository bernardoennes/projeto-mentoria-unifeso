import { createContext, useContext, useState } from 'react'
import { loginUser } from '../services/authService.js'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

const USER_STORAGE_KEY = 'condominio:user'
const MEMBERSHIP_STORAGE_KEY = 'condominio:membership'
const AUTH_STORAGE_KEY = 'condominio:auth'

function parseStoredItem(storageKey) {
  try {
    const value = sessionStorage.getItem(storageKey)

    if (!value) {
      return null
    }

    return JSON.parse(value)
  } catch {
    return null
  }
}

function setStoredItem(storageKey, value) {
  if (value) {
    sessionStorage.setItem(storageKey, JSON.stringify(value))
    return
  }

  sessionStorage.removeItem(storageKey)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => parseStoredItem(USER_STORAGE_KEY))
  const [membership, setMembership] = useState(() => parseStoredItem(MEMBERSHIP_STORAGE_KEY))
  const [auth, setAuth] = useState(() => parseStoredItem(AUTH_STORAGE_KEY))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const setSafeSession = (loginResult) => {
    const nextUser = loginResult?.user ?? null
    const nextMembership = loginResult?.membership ?? null
    const nextAuth = loginResult?.auth ?? null

    setUser(nextUser)
    setMembership(nextMembership)
    setAuth(nextAuth)

    setStoredItem(USER_STORAGE_KEY, nextUser)
    setStoredItem(MEMBERSHIP_STORAGE_KEY, nextMembership)
    setStoredItem(AUTH_STORAGE_KEY, nextAuth)
  }

  const signIn = async (credentials) => {
    setIsLoading(true)
    setError('')

    try {
      const loginData = await loginUser({
        cpf: credentials.cpf,
        password: credentials.password,
      })

      setSafeSession(loginData)
      return loginData
    } catch (loginError) {
      setError(loginError.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    setError('')
    await supabase.auth.signOut()
    setSafeSession(null)
  }

  const contextValue = {
    user,
    membership,
    auth,
    error,
    isLoading,
    isAuthenticated: Boolean(user && membership),
    signIn,
    signOut,
    clearError: () => setError(''),
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  }

  return context
}
