import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Moon, Sun, UserCircle } from '@phosphor-icons/react'
import ProfileModal from '../ProfileModal/ProfileModal.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import styles from './Header.module.css'

export default function Header({ title, subtitle, userName, accessType, onLogout }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const handleLogout = async () => {
    setIsProfileOpen(false)

    if (onLogout) {
      await onLogout()
    } else {
      await signOut()
    }

    navigate('/login', { replace: true })
  }

  const handleOpenSettings = () => {
    setIsProfileOpen(false)
    navigate('/settings?section=account')
  }

  return (
    <header className={styles.header}>
      <div className={styles.brandBlock}>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>

      <div className={styles.headerActions}>
        <div className={styles.profileWrapper}>
          <button
            type="button"
            className={styles.profileTrigger}
            aria-label="Abrir menu do perfil"
            title="Perfil"
            onClick={() => setIsProfileOpen((current) => !current)}
          >
            <UserCircle size={22} weight="regular" aria-hidden="true" />
          </button>

          {isProfileOpen && (
            <ProfileModal
              userName={userName}
              accessType={accessType}
              onClose={() => setIsProfileOpen(false)}
              onOpenSettings={handleOpenSettings}
              onLogout={handleLogout}
            />
          )}
        </div>
        <button
          type="button"
          className={styles.themeTrigger}
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
          {theme === 'dark'
            ? <Sun size={20} weight="regular" aria-hidden="true" />
            : <Moon size={20} weight="regular" aria-hidden="true" />}
        </button>
      </div>
    </header>
  )
}
