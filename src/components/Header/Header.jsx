import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, House, List, Moon, Sun, UserCircle, X } from '@phosphor-icons/react'
import ProfileModal from '../ProfileModal/ProfileModal.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import styles from './Header.module.css'

export default function Header({
  userName,
  accessType,
  isSettingsPage = false,
  navigationExpanded,
  onNavigationToggle,
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const mobileMenuOpen = navigationExpanded ?? false

  const toggleMobileMenu = () => {
    onNavigationToggle?.(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    onNavigationToggle?.(false)
  }

  const handleOpenSettings = () => {
    setIsProfileOpen(false)
    navigate('/settings?section=account')
  }

  const handleReturnHome = () => {
    setIsProfileOpen(false)
    closeMobileMenu()
    navigate('/')
  }

  const handleLogout = async () => {
    setIsProfileOpen(false)
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header
      className={[
        styles.header,
        onNavigationToggle ? styles.hasNavigationToggle : '',
        mobileMenuOpen ? styles.mobileMenuOpen : '',
      ].filter(Boolean).join(' ')}
    >
      <div className={styles.brandBlock}>
        <House className={styles.brandIcon} size={23} weight="fill" aria-hidden="true" />
        <div>
          <strong>Domus</strong>
        </div>
      </div>
      {onNavigationToggle && (
        <button
          type="button"
          className={styles.mobileMenuTrigger}
          aria-label={mobileMenuOpen ? 'Fechar navegação' : 'Abrir navegação'}
          aria-expanded={mobileMenuOpen}
          aria-controls="primary-navigation"
          onClick={toggleMobileMenu}
        >
          {mobileMenuOpen
            ? <X size={21} weight="bold" aria-hidden="true" />
            : <List size={21} weight="bold" aria-hidden="true" />}
        </button>
      )}
      <div className={styles.headerActions}>
        <div className={styles.profileWrapper}>
          <button
            type="button"
            className={styles.profileTrigger}
            aria-label={isSettingsPage ? 'Voltar para a página inicial' : 'Abrir menu do perfil'}
            title={isSettingsPage ? 'Página inicial' : 'Perfil'}
            aria-expanded={isSettingsPage ? undefined : isProfileOpen}
            onClick={isSettingsPage ? handleReturnHome : () => {
              closeMobileMenu()
              setIsProfileOpen((current) => !current)
            }}
          >
            {isSettingsPage
              ? <ArrowLeft size={21} weight="bold" aria-hidden="true" />
              : <UserCircle size={22} weight="regular" aria-hidden="true" />}
          </button>
          {!isSettingsPage && isProfileOpen && (
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
