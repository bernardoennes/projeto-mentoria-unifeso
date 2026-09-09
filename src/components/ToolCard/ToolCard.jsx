import { resolvePhosphorIcon } from '../../utils/phosphorIcons.js'
import styles from './ToolCard.module.css'

export default function ToolCard({
  title,
  iconName,
  value,
  variant = 'summary',
  expanded = false,
  onClick,
}) {
  const CardIcon = resolvePhosphorIcon(iconName)

  if (variant === 'nav') {
    const navExpandedClass = expanded ? ` ${styles.navExpanded}` : ''

    return (
      <button type="button" className={`${styles.navCard}${navExpandedClass}`} onClick={onClick}>
        <span className={styles.navIcon} aria-hidden="true">
          <CardIcon size={16} weight="bold" />
        </span>
        <span className={styles.navLabel}>{title}</span>
      </button>
    )
  }

  return (
    <article className={styles.card}>
      <div className={styles.cardIcon} aria-hidden="true">
        <CardIcon size={20} />
      </div>
      <h2>{title}</h2>
      <p>{value ?? ''}</p>
    </article>
  )
}
