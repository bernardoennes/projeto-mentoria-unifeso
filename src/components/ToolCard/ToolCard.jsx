import { resolvePhosphorIcon } from '../../utils/phosphorIcons.js'
import styles from './ToolCard.module.css'

export default function ToolCard({
  title,
  iconName,
  expanded = false,
  active = false,
  disabled = false,
  onClick,
}) {
  const CardIcon = resolvePhosphorIcon(iconName)
  const navExpandedClass = expanded ? ` ${styles.navExpanded}` : ''
  const navActiveClass = active ? ` ${styles.navActive}` : ''

  return (
    <button
      type="button"
      className={`${styles.navCard}${navExpandedClass}${navActiveClass}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className={styles.navIcon} aria-hidden="true">
        <CardIcon size={16} weight="bold" />
      </span>
      <span className={styles.navLabel}>{title}</span>
    </button>
  )
}
