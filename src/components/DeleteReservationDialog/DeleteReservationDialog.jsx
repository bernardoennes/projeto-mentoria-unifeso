import styles from './DeleteReservationDialog.module.css'

export default function DeleteReservationDialog({ reservation, onCancel, onConfirm }) {
  if (!reservation) {
    return null
  }

  return (
    <div className={styles.backdrop}>
      <section
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="deleteReservationTitle"
        aria-describedby="deleteReservationDescription"
      >
        <h2 id="deleteReservationTitle">Excluir reserva?</h2>
        <p id="deleteReservationDescription">
          Esta ação não pode ser desfeita. A reserva de {reservation.areaName} será removida.
        </p>
        <div className={styles.actions}>
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className={styles.confirmButton} onClick={onConfirm}>
            Excluir reserva
          </button>
        </div>
      </section>
    </div>
  )
}
