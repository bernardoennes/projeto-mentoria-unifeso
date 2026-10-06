import { useMemo, useState } from 'react'
import { CalendarBlank, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { getDateKey, getDayLabel, getMonthCells, getMonthLabel } from '../../utils/calendarUtils.js'
import styles from './MonthlyCalendar.module.css'

const weekdays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']

export default function MonthlyCalendar({ events = [] }) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(() => getDateKey(new Date()))

  const todayKey = getDateKey(new Date())
  const monthCells = getMonthCells(visibleMonth)
  const eventsByDate = useMemo(() => events.reduce((eventsByDay, event) => {
    const eventsForDay = eventsByDay.get(event.date) ?? []
    eventsForDay.push(event)
    eventsByDay.set(event.date, eventsForDay)
    return eventsByDay
  }, new Map()), [events])
  const upcomingEvents = useMemo(() => {
    const throughDate = new Date(`${selectedDate}T12:00:00`)
    throughDate.setDate(throughDate.getDate() + 30)
    const throughDateKey = getDateKey(throughDate)

    return events
      .filter((event) => event.date >= selectedDate && event.date <= throughDateKey)
      .slice(0, 4)
  }, [events, selectedDate])

  const changeMonth = (offset) => {
    const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1)
    setVisibleMonth(nextMonth)
    setSelectedDate(getDateKey(nextMonth))
  }

  const selectToday = () => {
    const today = new Date()
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(getDateKey(today))
  }

  return (
    <section className={styles.calendarPanel}>
      <header className={styles.panelHeading}>
        <span className={styles.iconBadge}>
          <CalendarBlank size={17} weight="bold" color="currentColor" aria-hidden="true" />
        </span>
        <h2>Calendário</h2>
      </header>

      <div className={styles.monthBar}>
        <button type="button" aria-label="Mês anterior" onClick={() => changeMonth(-1)}>
          <CaretLeft size={15} weight="bold" color="currentColor" aria-hidden="true" />
        </button>
        <strong>{getMonthLabel(visibleMonth)}</strong>
        <button type="button" aria-label="Próximo mês" onClick={() => changeMonth(1)}>
          <CaretRight size={15} weight="bold" color="currentColor" aria-hidden="true" />
        </button>
        <button type="button" className={styles.todayButton} onClick={selectToday}>
          Hoje
        </button>
      </div>

      <div className={styles.weekdayHeader} aria-hidden="true">
        {weekdays.map((weekday) => <span key={weekday}>{weekday}</span>)}
      </div>
      <div className={styles.monthGrid}>
        {monthCells.map((date, index) => {
          if (!date) {
            return <span key={`empty-${index}`} className={styles.emptyDay} aria-hidden="true" />
          }

          const dateKey = getDateKey(date)
          const eventsForDay = eventsByDate.get(dateKey) ?? []
          const isSelected = dateKey === selectedDate
          const isToday = dateKey === todayKey
          const dayClasses = [
            styles.dayButton,
            isSelected ? styles.selectedDay : '',
            isToday ? styles.currentDay : '',
          ].filter(Boolean).join(' ')

          return (
            <button
              type="button"
              key={dateKey}
              className={dayClasses}
              aria-label={`${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(date)}${eventsForDay.length ? `, ${eventsForDay.length} evento(s)` : ''}`}
              aria-pressed={isSelected}
              onClick={() => setSelectedDate(dateKey)}
            >
              <span>{date.getDate()}</span>
              {eventsForDay.length > 0 && (
                <span className={styles.eventMarkers} aria-hidden="true">
                  {eventsForDay.slice(0, 3).map((event) => (
                    <i
                      key={event.id}
                      className={event.type === 'holiday' ? styles.holidayMarker : styles.reservationMarker}
                    />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className={styles.upcomingSection}>
        <h3>Próximos eventos</h3>
        {upcomingEvents.length === 0 ? (
          <p className={styles.emptyEvents}>Nenhum feriado ou reserva nos próximos 30 dias.</p>
        ) : (
          <ul className={styles.eventList}>
            {upcomingEvents.map((event) => (
              <li className={styles.eventItem} key={event.id}>
                <span className={`${styles.eventDot} ${event.type === 'holiday' ? styles.holidayMarker : styles.reservationMarker}`} />
                <div>
                  <strong>{getDayLabel(event.date, todayKey, selectedDate)} · {event.title}</strong>
                  <span>{event.type === 'holiday' ? 'Feriado nacional' : event.detail}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}