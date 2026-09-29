import ToolCard from '../ToolCard/ToolCard.jsx'
import { useNavigate } from 'react-router-dom'
import styles from './Sidebar.module.css'

export default function Sidebar({ items, expanded, onExpand, onCollapse, activeId }) {
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
        {items.map((item) => (
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
