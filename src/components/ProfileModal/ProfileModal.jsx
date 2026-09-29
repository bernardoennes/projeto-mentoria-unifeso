import styles from './ProfileModal.module.css'

export default function ProfileModal({ userName, accessType, onClose, onOpenSettings, onLogout }) {
  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        role="menu"
        aria-label="Menu do perfil"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.headerSummary}>
          <strong>{userName}</strong>
          <span>{accessType}</span>
        </div>

        <button type="button" className={styles.actionButton} onClick={onOpenSettings}>
          Minha conta
        </button>
        <button type="button" className={styles.logoutButton} onClick={onLogout}>
          Sair da Conta
        </button>
      </div>
    </div>
  )
}
