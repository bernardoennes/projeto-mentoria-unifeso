import {
  CalendarBlank,
  CaretLeft,
  CaretRight,
  Clock,
  Note,
  PencilSimple,
  Trash,
  UserCircle,
  UsersThree,
} from '@phosphor-icons/react'
import { formatDate, parseDateKey } from '../../utils/calendarUtils.js'
import styles from './ReservationDetails.module.css'

export default function ReservationDetails({
  booking,
  bookingCount,
  bookingIndex,
  canManage,
  onEdit,
  onDelete,
  onIndexChange,
}) {
  return (
    <aside className={styles.detailsPanel} aria-live="polite">
      <div className={styles.detailsScroll}>
        <header className={styles.detailsHeader}>
          <h2>Detalhes da reserva</h2>
        </header>
        {booking ? (
          <div className={styles.bookingDetailContent} key={booking.id}>
            <div className={styles.selectedArea}>
              <span>
                Área Comum
                <small>ID da reserva: {booking.id}</small>
              </span>
              <strong>{booking.areaName}</strong>
              {booking.isEvent && <span className={styles.eventTag}>Evento prioritário</span>}
            </div>
            <div className={styles.bookingSummary}>
              <div>
                <CalendarBlank size={17} weight="bold" aria-hidden="true" />
                <span>{formatDate(parseDateKey(booking.date), {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}</span>
              </div>
              <div>
                <Clock size={17} weight="bold" aria-hidden="true" />
                <span>{booking.startTime} – {booking.endTime}</span>
              </div>
            </div>
            <dl className={styles.bookingDetails}>
              <div>
                <dt><UserCircle size={16} aria-hidden="true" />Morador</dt>
                <dd>{booking.residentName}</dd>
              </div>
              <div>
                <dt><UsersThree size={16} aria-hidden="true" />Número de pessoas</dt>
                <dd>{booking.numberOfPeople ?? 'Não informado'}</dd>
              </div>
              <div>
                <dt><Note size={16} aria-hidden="true" />Observações</dt>
                <dd>{booking.observations || 'Nenhuma observação informada.'}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className={styles.emptyDetails}>
            Selecione uma reserva na agenda para ver todos os seus dados.
          </p>
        )}
      </div>
      {(canManage || bookingCount > 1) && (
        <footer className={styles.detailsFooter}>
          {canManage && (
            <div className={styles.bookingActions}>
              <button type="button" onClick={onEdit}>
                <PencilSimple size={16} aria-hidden="true" />
                Editar
              </button>
              <button
                type="button"
                className={styles.deleteBookingButton}
                onClick={() => onDelete(booking)}
              >
                <Trash size={16} aria-hidden="true" />
                Excluir
              </button>
            </div>
          )}
          {bookingCount > 1 && (
            <div className={styles.bookingPagination}>
              <button
                type="button"
                aria-label="Reserva anterior"
                onClick={() => onIndexChange((index) => (index === 0 ? bookingCount - 1 : index - 1))}
              >
                <CaretLeft size={16} weight="bold" />
              </button>
              <span>{bookingIndex + 1} de {bookingCount}</span>
              <button
                type="button"
                aria-label="Próxima reserva"
                onClick={() => onIndexChange((index) => (index + 1) % bookingCount)}
              >
                <CaretRight size={16} weight="bold" />
              </button>
            </div>
          )}
        </footer>
      )}
    </aside>
  )
}
