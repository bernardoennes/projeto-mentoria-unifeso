import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)
const THEME_STORAGE_KEY = 'condominio:theme'

function readStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

if (typeof document !== 'undefined') {
  document.documentElement.dataset.theme = readStoredTheme()
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStoredTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Keep the selected theme active for this page when storage is unavailable.
    }
  }, [theme])

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider.')
  }

  return context
}