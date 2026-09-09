import styles from './Header.module.css'

export default function Header({ title, subtitle, userName }) {
  return (
    <header className={styles.header}>
      <div className={styles.brandBlock}>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
      <div className={styles.headerUser}>{userName}</div>
    </header>
  )
}
