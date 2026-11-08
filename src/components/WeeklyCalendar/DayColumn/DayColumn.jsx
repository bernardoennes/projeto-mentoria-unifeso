import { formatDate, getBookingLanes, getDateKey } from '../../../utils/calendarUtils.js'
import BookingBlock from '../BookingBlock/BookingBlock.jsx'
import BookingCluster from '../BookingCluster/BookingCluster.jsx'
import styles from './DayColumn.module.css'

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)

export default function DayColumn({
  date,
  bookingGroups,
  selectedSlot,
  selectedBookingIds,
  onSelectSlot,
  onSelectGroup,
}) {
  const dateKey = getDateKey(date)

  return (
    <div className={styles.dayColumn}>
      <div className={styles.daySlots}>
        {HOURS.map((hour) => {
          const isSelected = selectedSlot?.dateKey === dateKey && selectedSlot.hour === hour

          return (
            <button
              type="button"
              key={hour}
              className={isSelected ? styles.selectedCalendarSlot : ''}
              aria-label={`${formatDate(date, { dateStyle: 'full' })}, ${String(hour).padStart(2, '0')}:00`}
              aria-pressed={isSelected}
              onClick={() => onSelectSlot(date, hour)}
            />
          )
        })}
      </div>
      {bookingGroups.map((group) => {
        const isSelected = group.bookings.some((booking) => selectedBookingIds.includes(booking.id))

        if (group.bookings.length > 2) {
          return (
            <BookingCluster
              key={group.bookings[0].id}
              group={group}
              isSelected={isSelected}
              onSelect={onSelectGroup}
            />
          )
        }

        const bookingLanes = getBookingLanes(group.bookings)
        return group.bookings.map((booking, index) => (
          <BookingBlock
            key={booking.id}
            booking={booking}
            colorIndex={index}
            lane={bookingLanes.get(booking)}
            isSelected={isSelected}
          />
        ))
      })}
    </div>
  )
}
