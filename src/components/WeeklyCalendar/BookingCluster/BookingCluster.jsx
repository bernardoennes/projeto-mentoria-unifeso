import { Plus } from '@phosphor-icons/react'
import { getBookingMinutes } from '../../../utils/calendarUtils.js'
import { compareBookingPriority } from '../../../utils/reservationUtils.js'
import { HOUR_HEIGHT, RESERVATION_COLORS } from '../constants.js'
import styles from './BookingCluster.module.css'

export default function BookingCluster({ group, isSelected, onSelect }) {
  const primaryBooking = [...group.bookings].sort(compareBookingPriority)[0]
  const primaryIndex = group.bookings.indexOf(primaryBooking)
  const top = group.start / 60 * HOUR_HEIGHT
  const height = Math.max(25, (group.end - group.start) / 60 * HOUR_HEIGHT - 3)
  const cardTop = (getBookingMinutes(primaryBooking.startTime) - group.start) / 60 * HOUR_HEIGHT
  const cardHeight = Math.max(
    25,
    (getBookingMinutes(primaryBooking.endTime) - getBookingMinutes(primaryBooking.startTime))
      / 60 * HOUR_HEIGHT - 3,
  )
  const areaFontSize = Math.max(10, Math.min(13, 10 + (cardHeight - 40) / 90))
  const detailFontSize = Math.max(9, Math.min(11, areaFontSize - 1))
  const colorClass = primaryBooking.isEvent
    ? styles.eventBookingCard
    : styles[RESERVATION_COLORS[primaryIndex % RESERVATION_COLORS.length]]

  return (
    <div
      className={`${styles.bookingCluster}${isSelected ? ` ${styles.selectedBooking}` : ''}`}
      style={{ top: `${top}px`, height: `${height}px` }}
    >
      <span
        className={`${styles.bookingCard} ${colorClass}`}
        style={{
          top: `${cardTop}px`,
          height: `${cardHeight}px`,
          '--booking-area-font-size': `${areaFontSize}px`,
          '--booking-detail-font-size': `${detailFontSize}px`,
        }}
      >
        <strong className={styles.bookingArea}>
          {primaryBooking.isEvent && 'EVENTO · '}{primaryBooking.areaName}
        </strong>
        <span className={styles.bookingInfo}>
          {cardHeight >= 64 && <span>{primaryBooking.residentName}</span>}
          <small>{primaryBooking.startTime}–{primaryBooking.endTime}</small>
          <button
            type="button"
            className={styles.moreBookings}
            aria-label={`Ver todas as ${group.bookings.length} reservas neste intervalo`}
            title={`Ver ${group.bookings.length} reservas`}
            onClick={() => onSelect(group, primaryBooking.id)}
          >
            <Plus size={10} weight="bold" aria-hidden="true" />
            {group.bookings.length - 1}
          </button>
        </span>
      </span>
    </div>
  )
}
