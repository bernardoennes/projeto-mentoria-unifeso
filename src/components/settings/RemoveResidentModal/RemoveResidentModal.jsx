import styles from './RemoveResidentModal.module.css'

export default function RemoveResidentModal({ resident, isRemoving, onCancel, onConfirm }) {
  if (!resident) {
    return null
  }

  return (
    <div className={styles.backdrop} onMouseDown={onCancel}>
      <section
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="remove-resident-title"
        aria-describedby="remove-resident-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="remove-resident-title">Remover condômino?</h2>
        <p id="remove-resident-description">
          O vínculo de <strong>{resident.name}</strong> com este condomínio será removido. A conta e o perfil da pessoa serão mantidos.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={isRemoving}>
            Cancelar
          </button>
          <button type="button" className={styles.confirmButton} onClick={onConfirm} disabled={isRemoving}>
            {isRemoving ? 'Removendo...' : 'Remover vínculo'}
          </button>
        </div>
      </section>
    </div>
  )
}
