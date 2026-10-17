import { createContext, useContext, useEffect, useRef, useState } from 'react'

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
  const transitionTimer = useRef(0)

  useEffect(() => {
    document.documentElement.dataset.theme = theme

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Keep the selected theme active for this page when storage is unavailable.
    }
  }, [theme])

  const toggleTheme = () => {
    const root = document.documentElement
    root.classList.add('theme-transition')
    window.clearTimeout(transitionTimer.current)
    transitionTimer.current = window.setTimeout(() => {
      root.classList.remove('theme-transition')
    }, 500)
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

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