import { CaretDown } from '@phosphor-icons/react'
import styles from './SettingsSidebar.module.css'

export default function SettingsSidebar({ items, activeItem, onSelect }) {
  const groups = [...new Set(items.map((item) => item.group))]
  const selectedItem = items.find((item) => item.id === activeItem) ?? items[0]
  const SelectedIcon = selectedItem?.icon

  return (
    <div className={styles.navigation}>
      <aside className={styles.sidebar}>
        {groups.map((group) => (
          <div className={styles.navGroup} key={group}>
            <h2 className={styles.groupLabel}>
              {group === 'management' ? 'Administração' : 'Configurações'}
            </h2>
            <nav aria-label={group === 'management' ? 'Administração' : 'Configurações'}>
              {items.filter((item) => item.group === group).map((item) => {
                const isActive = item.id === activeItem
                const Icon = item.icon

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={isActive ? styles.activeButton : styles.navButton}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => onSelect(item.id)}
                  >
                    <Icon size={17} weight={isActive ? 'fill' : 'regular'} aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        ))}
      </aside>
      <div className={styles.mobileSelect}>
        <div className={styles.mobileSelectSummary} aria-hidden="true">
          {SelectedIcon && <SelectedIcon size={20} weight="fill" />}
        </div>
        <label className={styles.selectControl}>
          <span className={styles.visuallyHidden}>Escolher seção das configurações</span>
          <select
            value={activeItem}
            onChange={(event) => onSelect(event.target.value)}
            aria-label="Escolher seção das configurações"
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
          <CaretDown className={styles.selectIcon} size={16} weight="bold" aria-hidden="true" />
        </label>
      </div>
    </div>
  )
}
