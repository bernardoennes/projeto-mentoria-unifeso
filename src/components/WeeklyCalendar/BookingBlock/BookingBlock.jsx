import { getBookingMinutes } from '../../../utils/calendarUtils.js'
import { HOUR_HEIGHT, RESERVATION_COLORS } from '../constants.js'
import styles from './BookingBlock.module.css'

export default function BookingBlock({ booking, colorIndex, lane, isSelected }) {
  const start = getBookingMinutes(booking.startTime)
  const end = getBookingMinutes(booking.endTime)
  const top = start / 60 * HOUR_HEIGHT
  const height = Math.max(25, (end - start) / 60 * HOUR_HEIGHT - 3)
  const cardWidth = 110 * lane.span / lane.laneCount
  const areaFontSize = Math.max(9, Math.min(13, 9 + (cardWidth - 50) / 24))
  const detailFontSize = Math.max(9, Math.min(11, areaFontSize - 1))
  const showResident = height >= 80 && cardWidth >= 110
  const colorClass = booking.isEvent
    ? styles.eventBookingBlock
    : styles[RESERVATION_COLORS[colorIndex % RESERVATION_COLORS.length]]

  return (
    <div
      className={`${styles.bookingBlock} ${colorClass}${isSelected ? ` ${styles.selectedBooking}` : ''}`}
      aria-hidden="true"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left: `calc(${lane.lane / lane.laneCount * 100}% + 3px)`,
        width: `calc(${lane.span / lane.laneCount * 100}% - 6px)`,
        '--booking-area-font-size': `${areaFontSize}px`,
        '--booking-detail-font-size': `${detailFontSize}px`,
      }}
      title={`${booking.isEvent ? 'Evento, ' : ''}${booking.areaName}, ${booking.startTime}–${booking.endTime}, ${booking.residentName}`}
    >
      <strong className={styles.bookingArea}>
        {booking.isEvent && 'EVENTO · '}{booking.areaName}
      </strong>
      <span className={styles.bookingInfo}>
        {showResident && <span>{booking.residentName}</span>}
        <small>{booking.startTime}–{booking.endTime}</small>
      </span>
    </div>
  )
}
