import styles from './SettingsSidebar.module.css'

export default function SettingsSidebar({ items, activeItem, onSelect }) {
  return (
    <aside className={styles.sidebar}>
      {items.map((item) => {
        const isActive = item.id === activeItem

        return (
          <button
            key={item.id}
            type="button"
            className={isActive ? styles.activeButton : styles.navButton}
            onClick={() => onSelect(item.id)}
          >
            {item.label}
          </button>
        )
      })}
    </aside>
  )
}
