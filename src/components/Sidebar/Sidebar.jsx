import ToolCard from '../ToolCard/ToolCard.jsx'
import { DoorOpen, Moon, Sun, UserCircle } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import styles from './Sidebar.module.css'

const navItems = [
  { id: 'home', label: 'Home', iconName: 'House', path: '/' },
  { id: 'reservas', label: 'Reservas', iconName: 'CalendarCheck', path: '/reservas' },
  { id: 'moradores', label: 'Moradores', iconName: 'UsersThree' },
  { id: 'financeiro', label: 'Financeiro', iconName: 'CurrencyDollar' },
  { id: 'pacotes', label: 'Encomendas', iconName: 'Package' },
]

export default function Sidebar({
  expanded,
  onExpand,
  onCollapse,
  activeId,
  userName,
  accessType,
}) {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const expandedClass = expanded ? ` ${styles.expanded}` : ''
  const accountName = userName || 'Morador'

  const openAccountSettings = () => {
    onCollapse()
    navigate('/settings?section=account')
  }

  const handleLogout = async () => {
    onCollapse()
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className={`${styles.sideNav}${expandedClass}`}
      aria-label="Navegação principal"
      aria-expanded={expanded}
      onMouseEnter={() => {
        if (window.matchMedia('(min-width: 701px)').matches) onExpand()
      }}
      onMouseLeave={() => {
        if (window.matchMedia('(min-width: 701px)').matches) onCollapse()
      }}
    >
      <nav id="primary-navigation" className={styles.navList}>
        {navItems.map((item) => (
          <ToolCard
            key={item.id}
            title={item.label}
            iconName={item.iconName}
            variant="nav"
            expanded={expanded}
            active={item.id === activeId}
            disabled={!item.path}
            onClick={() => {
              if (item.path) navigate(item.path)
              onCollapse()
            }}
          />
        ))}
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.accountSummary}>
          <UserCircle size={20} weight="fill" aria-hidden="true" />
          <div>
            <strong title={accountName}>{accountName}</strong>
            <span title={accessType || 'Não definido'}>{accessType || 'Não definido'}</span>
          </div>
        </div>

        <div className={styles.accountActions}>
          <button
            type="button"
            className={styles.actionButton}
            onClick={openAccountSettings}
            aria-label="Minha conta"
          >
            <UserCircle size={19} weight="regular" aria-hidden="true" />
            <span>Minha conta</span>
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.logoutButton}`}
            onClick={handleLogout}
            aria-label="Sair da conta"
          >
            <DoorOpen size={19} weight="regular" aria-hidden="true" />
            <span>Sair da conta</span>
          </button>
          <button
            type="button"
            className={styles.actionButton}
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            {theme === 'dark'
              ? <Sun size={19} weight="regular" aria-hidden="true" />
              : <Moon size={19} weight="regular" aria-hidden="true" />}
            <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
