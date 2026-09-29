import styles from './InfoField.module.css'

export default function InfoField({ label, value }) {
  return (
    <div className={styles.fieldGroup}>
      <span className={styles.fieldLabel}>{label}</span>
      <strong className={styles.fieldValue}>{value}</strong>
    </div>
  )
}
