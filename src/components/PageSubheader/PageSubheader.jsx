import { ArrowLeft } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import styles from './PageSubheader.module.css'

export default function PageSubheader({
  title,
  subtitle,
  backTo = '/',
  backLabel = 'Voltar para a home',
  className = '',
}) {
  return (
    <header className={`${styles.subheader} ${className}`}>
      <div className={styles.copy}>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <Link to={backTo} className={styles.backButton}>
        <ArrowLeft size={17} weight="bold" aria-hidden="true" />
        {backLabel}
      </Link>
    </header>
  )
}
