import { useEffect, useRef } from 'react'
import { CalendarBlank } from '@phosphor-icons/react'
import { formatDate, getDateKey } from '../../utils/calendarUtils.js'
import DayColumn from './DayColumn/DayColumn.jsx'
import styles from './WeeklyCalendar.module.css'

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)

export default function WeeklyCalendar({
  weekDates,
  todayKey,
  bookingGroupsByDate,
  selectedSlot,
  selectedBookingIds,
  onSelectDay,
  onSelectSlot,
  onSelectGroup,
}) {
  const calendarViewportRef = useRef(null)

  useEffect(() => {
    const currentHour = new Date().getHours()
    if (calendarViewportRef.current) {
      calendarViewportRef.current.scrollTop = currentHour * 80
    }
  }, [])

  return (
    <section className={styles.calendarPanel} aria-label="Agenda semanal">
      <div className={styles.calendarViewport} ref={calendarViewportRef}>
        <div className={styles.calendarCanvas}>
          <div className={styles.weekHeader}>
            <div className={styles.timeHeader} aria-hidden="true">
              <CalendarBlank size={16} />
            </div>
            {weekDates.map((date) => {
              const dateKey = getDateKey(date)

              return (
                <button
                  type="button"
                  key={dateKey}
                  className={`${styles.dayHeader}${dateKey === todayKey ? ` ${styles.todayHeader}` : ''}`}
                  onClick={() => onSelectDay(dateKey)}
                >
                  <span>{formatDate(date, { weekday: 'short' }).replace('.', '').toUpperCase()}</span>
                  <strong>{date.getDate()}</strong>
                </button>
              )
            })}
          </div>

          <div className={styles.calendarBody}>
            <div className={styles.timeAxis} aria-hidden="true">
              {HOURS.map((hour) => (
                <span key={hour}>{`${String(hour).padStart(2, '0')}:00`}</span>
              ))}
            </div>
            {weekDates.map((date) => (
              <DayColumn
                key={getDateKey(date)}
                date={date}
                bookingGroups={bookingGroupsByDate.get(getDateKey(date)) ?? []}
                selectedSlot={selectedSlot}
                selectedBookingIds={selectedBookingIds}
                onSelectSlot={onSelectSlot}
                onSelectGroup={onSelectGroup}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
