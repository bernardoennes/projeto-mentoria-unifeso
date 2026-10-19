import styles from './EditMemberModal.module.css'

export default function EditMemberModal({ title, name, isSaving, onCancel, onSubmit, children }) {
  return (
    <div className={styles.backdrop} onMouseDown={() => !isSaving && onCancel()}>
      <form
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-member-title"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={onSubmit}
      >
        <h2 id="edit-member-title">{title}</h2>
        <p className={styles.subtitle}>{name}</p>
        <div className={styles.fields}>{children}</div>
        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={isSaving}>
            Cancelar
          </button>
          <button type="submit" className={styles.saveButton} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}
