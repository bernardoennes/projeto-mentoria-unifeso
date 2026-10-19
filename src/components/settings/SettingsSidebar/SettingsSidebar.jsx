import Select from '../../Select/Select'
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
        <div className={styles.selectControl}>
          <Select
            value={activeItem}
            onChange={onSelect}
            ariaLabel="Escolher seção das configurações"
            options={items.map((item) => ({ value: item.id, label: item.label }))}
          />
        </div>
      </div>
    </div>
  )
}
