import styles from './Header.module.css'

export default function Header({ title, subtitle, userName, accessType, onLogout }) {
  return (
    <header className={styles.header}>
      <div className={styles.brandBlock}>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
      <div className={styles.headerActions}>
        <div className={styles.headerUser}>
          {userName} | {accessType}
        </div>
        <button type="button" className={styles.logoutButton} onClick={onLogout}>
          Sair
        </button>
      </div>
    </header>
  )
}
