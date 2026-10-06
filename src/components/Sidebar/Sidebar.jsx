import ToolCard from '../ToolCard/ToolCard.jsx'
import { useNavigate } from 'react-router-dom'
import styles from './Sidebar.module.css'

const navItems = [
  { id: 'home', label: 'Home', iconName: 'House', path: '/' },
  { id: 'reservas', label: 'Reservas', iconName: 'CalendarCheck', path: '/reservas' },
  { id: 'moradores', label: 'Moradores', iconName: 'UsersThree' },
  { id: 'financeiro', label: 'Financeiro', iconName: 'CurrencyDollar' },
  { id: 'pacotes', label: 'Encomendas', iconName: 'Package' },
]

export default function Sidebar({ expanded, onExpand, onCollapse, activeId }) {
  const navigate = useNavigate()
  const expandedClass = expanded ? ` ${styles.expanded}` : ''

  return (
    <aside
      className={`${styles.sideNav}${expandedClass}`}
      onMouseEnter={onExpand}
      onMouseLeave={onCollapse}
      aria-label="Navegacao principal"
    >
      <nav className={styles.navList}>
        {navItems.map((item) => (
          <ToolCard
            key={item.id}
            title={item.label}
            iconName={item.iconName}
            variant="nav"
            expanded={expanded}
            active={item.id === activeId}
            disabled={!item.path}
            onClick={() => item.path && navigate(item.path)}
          />
        ))}
      </nav>
    </aside>
  )
}
