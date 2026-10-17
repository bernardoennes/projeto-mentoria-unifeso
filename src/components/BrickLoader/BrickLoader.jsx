import styles from './BrickLoader.module.css'

const BRICKS = [0, 1, 2, 3, 4, 5]

export default function BrickLoader({ size = 'md', inline = false }) {
  return (
    <div
      className={`${styles.wrapper} ${styles[size] ?? ''} ${inline ? styles.inline : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Carregando"
    >
      <div className={styles.wall} aria-hidden="true">
        {BRICKS.map((index) => (
          <span key={index} className={`${styles.brick} ${styles[`brick${index}`]}`} />
        ))}
      </div>
    </div>
  )
}
