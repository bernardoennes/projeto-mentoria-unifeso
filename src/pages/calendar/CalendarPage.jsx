import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarBlank, CaretLeft, CaretRight, Funnel, Plus } from '@phosphor-icons/react'
import { toast } from 'react-toastify'
import Header from '../../components/Header/Header.jsx'
import Sidebar from '../../components/Sidebar/Sidebar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { fetchCommonAreas, AREA_TYPE_LABELS } from '../../services/commonAreaService.js'
import { buildUserProfile } from '../../services/userService.js'
import styles from './CalendarPage.module.css'

const navItems = [
  { id: 'home', label: 'Home', iconName: 'House', path: '/' },
  { id: 'reservas', label: 'Reservas', iconName: 'CalendarCheck', path: '/reservas' },
  { id: 'moradores', label: 'Moradores', iconName: 'UsersThree' },
  { id: 'financeiro', label: 'Financeiro', iconName: 'CurrencyDollar' },
  { id: 'pacotes', label: 'Encomendas', iconName: 'Package' },
]

const HOUR_HEIGHT = 32
const HALF_HOUR = 30
const reservationColors = ['mint', 'ochre', 'blue']

function getDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateKey(dateKey) {
  return new Date(`${dateKey}T12:00:00`)
}

function getWeekDates(dateKey) {
  const selectedDate = parseDateKey(dateKey)
  const monday = new Date(selectedDate)
  monday.setDate(selectedDate.getDate() - ((selectedDate.getDay() + 6) % 7))

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return date
  })
}

function formatDate(date, options) {
  return new Intl.DateTimeFormat('pt-BR', options).format(date)
}

function toMinutes(value, fallback) {
  const time = String(value ?? fallback).slice(0, 5)
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function toTimeValue(minutes) {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`
}

function getAreaTimeOptions(area) {
  const start = toMinutes(area?.start_hour, '06:00')
  const end = toMinutes(area?.end_hour, '23:00')
  const options = []

  for (let minute = start; minute + HALF_HOUR <= end; minute += HALF_HOUR) {
    options.push(toTimeValue(minute))
  }

  return { start, end, options }
}

function getSuggestedTimes(area) {
  const { options, end } = getAreaTimeOptions(area)
  const start = options[0] ?? ''
  const endOptions = [...options.filter((time) => toMinutes(time) > toMinutes(start)), toTimeValue(end)]
  const finish = endOptions.find((time) => toMinutes(time) >= toMinutes(start) + 120)
    ?? endOptions.at(-1)
    ?? ''

  return { start, end: finish }
}

function isAreaOpenOnDate(area, date) {
  const availableWeekdays = area?.available_weekdays

  if (!Array.isArray(availableWeekdays)) {
    return true
  }

  const weekday = date.getDay() === 0 ? 7 : date.getDay()
  return availableWeekdays.map(Number).includes(weekday)
}

function getNumberedAreas(areas) {
  const counts = new Map()

  return areas.map((area) => {
    const sequence = (counts.get(area.area_type) ?? 0) + 1
    counts.set(area.area_type, sequence)
    const label = AREA_TYPE_LABELS[area.area_type] ?? area.area_type

    return {
      ...area,
      displayName: areas.filter((item) => item.area_type === area.area_type).length > 1
        ? `${label} ${sequence}`
        : label,
    }
  })
}

function getBookingMinutes(value) {
  return toMinutes(value, '00:00')
}

function getBookingLanes(bookingsForDay) {
  const sortedBookings = [...bookingsForDay].sort((first, second) => (
    getBookingMinutes(first.startTime) - getBookingMinutes(second.startTime)
    || getBookingMinutes(first.endTime) - getBookingMinutes(second.endTime)
  ))
  const groups = []
  let currentGroup = []
  let groupEnd = -1

  for (const booking of sortedBookings) {
    const start = getBookingMinutes(booking.startTime)
    const end = getBookingMinutes(booking.endTime)

    if (currentGroup.length > 0 && start >= groupEnd) {
      groups.push(currentGroup)
      currentGroup = []
    }

    currentGroup.push({ booking, start, end })
    groupEnd = Math.max(groupEnd, end)
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup)
  }

  const layouts = new Map()

  for (const group of groups) {
    const laneEnds = []
    const positionedBookings = group.map((item) => {
      let lane = laneEnds.findIndex((laneEnd) => laneEnd <= item.start)

      if (lane === -1) {
        lane = laneEnds.length
      }

      laneEnds[lane] = item.end
      return { ...item, lane }
    })
    const laneCount = laneEnds.length

    for (const item of positionedBookings) {
      let span = 1

      for (let lane = item.lane + 1; lane < laneCount; lane += 1) {
        const laneIsOccupied = positionedBookings.some((other) => (
          other.lane === lane && other.start < item.end && other.end > item.start
        ))

        if (laneIsOccupied) {
          break
        }

        span += 1
      }

      layouts.set(item.booking, { lane: item.lane, laneCount, span })
    }
  }

  return layouts
}

export default function CalendarPage() {
  const { user, membership } = useAuth()
  const profile = buildUserProfile(user, membership)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [areas, setAreas] = useState([])
  const [areasError, setAreasError] = useState('')
  const [isLoadingAreas, setIsLoadingAreas] = useState(true)
  const [selectedDate, setSelectedDate] = useState(() => getDateKey(new Date()))
  const [selectedAreaId, setSelectedAreaId] = useState('')
  const [selectedStart, setSelectedStart] = useState('')
  const [selectedEnd, setSelectedEnd] = useState('')
  const [bookings, setBookings] = useState([])
  const [filterAreaId, setFilterAreaId] = useState('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const numberedAreas = useMemo(() => getNumberedAreas(areas), [areas])
  const selectedArea = numberedAreas.find((area) => String(area.id) === selectedAreaId)
  const weekDates = getWeekDates(selectedDate)
  const todayKey = getDateKey(new Date())
  const weekLabel = `${formatDate(weekDates[0], { day: 'numeric' })} – ${formatDate(weekDates[6], {
    day: 'numeric',
    month: 'short',
  })} ${weekDates[6].getFullYear()}`
  const areaTimeRange = getAreaTimeOptions(selectedArea)
  const endTimeOptions = selectedStart
    ? [
      ...areaTimeRange.options.filter((time) => toMinutes(time) > toMinutes(selectedStart)),
      toTimeValue(areaTimeRange.end),
    ]
    : []
  const isSelectedDayOpen = selectedArea && isAreaOpenOnDate(selectedArea, parseDateKey(selectedDate))
  const isSelectedTimeOpen = selectedStart && selectedEnd
    && toMinutes(selectedStart) >= areaTimeRange.start
    && toMinutes(selectedEnd) <= areaTimeRange.end
  const hasTimeConflict = selectedArea && bookings.some((booking) => {
    if (String(booking.areaId) !== selectedAreaId || booking.date !== selectedDate) {
      return false
    }

    return toMinutes(selectedStart) < toMinutes(booking.endTime)
      && toMinutes(selectedEnd) > toMinutes(booking.startTime)
  })
  const filteredBookings = bookings.filter((booking) => (
    filterAreaId === 'all' || String(booking.areaId) === filterAreaId
  ))

  useEffect(() => {
    let isCurrent = true

    async function loadAreas() {
      setIsLoadingAreas(true)
      setAreasError('')

      try {
        const result = await fetchCommonAreas(membership?.organisation_id)
        if (isCurrent) {
          setAreas(result)
          if (result[0]) {
            const suggestedTimes = getSuggestedTimes(result[0])
            setSelectedAreaId(String(result[0].id))
            setSelectedStart(suggestedTimes.start)
            setSelectedEnd(suggestedTimes.end)
          }
        }
      } catch (error) {
        if (isCurrent) {
          setAreasError(error?.message ?? 'Não foi possível carregar as áreas comuns.')
        }
      } finally {
        if (isCurrent) {
          setIsLoadingAreas(false)
        }
      }
    }

    loadAreas()
    return () => {
      isCurrent = false
    }
  }, [membership?.organisation_id])

  const changeWeek = (offset) => {
    const nextDate = parseDateKey(selectedDate)
    nextDate.setDate(nextDate.getDate() + offset * 7)
    setSelectedDate(getDateKey(nextDate))
  }

  const selectCalendarSlot = (date, hour) => {
    const dateKey = getDateKey(date)
    const clickedTime = `${String(hour).padStart(2, '0')}:00`

    if (dateKey < todayKey) {
      return
    }

    setSelectedDate(dateKey)

    if (!selectedArea || !areaTimeRange.options.includes(clickedTime)) {
      return
    }

    setSelectedStart(clickedTime)
    const availableEndTimes = [
      ...areaTimeRange.options.filter((time) => toMinutes(time) > hour * 60),
      toTimeValue(areaTimeRange.end),
    ]
    setSelectedEnd(availableEndTimes.find((time) => toMinutes(time) >= hour * 60 + 120)
      ?? availableEndTimes[0]
      ?? '')
  }

  const handleStartTimeChange = (value) => {
    setSelectedStart(value)
    setSelectedEnd(endTimeOptions.find((time) => toMinutes(time) >= toMinutes(value) + 120)
      ?? endTimeOptions.find((time) => toMinutes(time) > toMinutes(value))
      ?? '')
  }

  const handleAreaChange = (areaId) => {
    setSelectedAreaId(areaId)
    const area = numberedAreas.find((item) => String(item.id) === areaId)
    const suggestedTimes = getSuggestedTimes(area)
    setSelectedStart(suggestedTimes.start)
    setSelectedEnd(suggestedTimes.end)
  }

  const handleCreateBooking = (event) => {
    event.preventDefault()

    if (!selectedArea || !selectedStart || !selectedEnd) {
      toast.error('Selecione uma área e um horário para continuar.')
      return
    }

    if (selectedDate < todayKey) {
      toast.error('Não é possível reservar em uma data passada.')
      return
    }

    if (!isSelectedDayOpen) {
      toast.error('Esta área não funciona no dia selecionado.')
      return
    }

    if (!isSelectedTimeOpen) {
      toast.error('O horário escolhido está fora do período de funcionamento da área.')
      return
    }

    if (hasTimeConflict) {
      toast.error('Este horário já possui uma reserva para a área selecionada.')
      return
    }

    setBookings((current) => [...current, {
      id: `${Date.now()}`,
      areaId: selectedArea.id,
      areaName: selectedArea.displayName,
      date: selectedDate,
      startTime: selectedStart,
      endTime: selectedEnd,
      residentName: profile?.name ?? 'Você',
    }])
    toast.success('Reserva adicionada à agenda desta sessão.')
  }

  const overlayClass = isSidebarExpanded ? ` ${styles.overlayVisible}` : ''

  return (
    <div className={styles.pageShell}>
      <Header
        title="Condomínio"
        subtitle="Sistema de Gerenciamento"
        userName={profile?.name ?? 'Usuário'}
        accessType={profile?.access_type ?? 'Não definido'}
      />

      <div className={styles.pageBody}>
        <div className={`${styles.pageOverlay}${overlayClass}`} />
        <Sidebar
          items={navItems}
          expanded={isSidebarExpanded}
          onExpand={() => setIsSidebarExpanded(true)}
          onCollapse={() => setIsSidebarExpanded(false)}
          activeId="reservas"
        />

        <main className={styles.content}>
          <div className={styles.pageHeading}>
            <div>
              <h1>Calendário</h1>
              <p>Consulte a semana e reserve uma área comum.</p>
            </div>
            <div className={styles.calendarControls}>
              <button
                type="button"
                className={styles.todayButton}
                onClick={() => setSelectedDate(todayKey)}
              >
                Hoje
              </button>
              <div className={styles.weekNavigator} aria-label="Navegação da semana">
                <button type="button" aria-label="Semana anterior" onClick={() => changeWeek(-1)}>
                  <CaretLeft size={17} weight="bold" />
                </button>
                <span>{weekLabel}</span>
                <button type="button" aria-label="Próxima semana" onClick={() => changeWeek(1)}>
                  <CaretRight size={17} weight="bold" />
                </button>
              </div>
              <div className={styles.filterWrap}>
                <button
                  type="button"
                  className={styles.filterButton}
                  aria-label="Filtrar reservas por área"
                  aria-expanded={isFilterOpen}
                  onClick={() => setIsFilterOpen((current) => !current)}
                >
                  <Funnel size={18} />
                </button>
                {isFilterOpen && (
                  <label className={styles.filterPopover}>
                    <span>Exibir área</span>
                    <select value={filterAreaId} onChange={(event) => setFilterAreaId(event.target.value)}>
                      <option value="all">Todas as áreas</option>
                      {numberedAreas.map((area) => (
                        <option key={area.id} value={String(area.id)}>{area.displayName}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className={styles.calendarLayout}>
            <section className={styles.calendarPanel} aria-label="Agenda semanal">
              <div className={styles.calendarViewport}>
                <div className={styles.calendarCanvas}>
                  <div className={styles.weekHeader}>
                    <div className={styles.timeHeader} aria-hidden="true">
                      <CalendarBlank size={16} />
                    </div>
                    {weekDates.map((date) => {
                      const dateKey = getDateKey(date)
                      const isToday = dateKey === todayKey

                      return (
                        <button
                          type="button"
                          key={dateKey}
                          className={`${styles.dayHeader}${isToday ? ` ${styles.todayHeader}` : ''}`}
                          onClick={() => setSelectedDate(dateKey)}
                          disabled={dateKey < todayKey}
                        >
                          <span>{formatDate(date, { weekday: 'short' }).replace('.', '').toUpperCase()}</span>
                          <strong>{date.getDate()}</strong>
                        </button>
                      )
                    })}
                  </div>

                  <div className={styles.calendarBody}>
                    <div className={styles.timeAxis} aria-hidden="true">
                      {Array.from({ length: 24 }, (_, hour) => (
                        <span key={hour}>{`${String(hour).padStart(2, '0')}:00`}</span>
                      ))}
                    </div>
                    {weekDates.map((date) => {
                      const dateKey = getDateKey(date)
                      const dayBookings = filteredBookings.filter((booking) => booking.date === dateKey)
                      const bookingLanes = getBookingLanes(dayBookings)

                      return (
                        <div className={styles.dayColumn} key={dateKey}>
                          <div className={styles.daySlots}>
                            {Array.from({ length: 24 }, (_, hour) => (
                              <button
                                type="button"
                                key={hour}
                                aria-label={`${formatDate(date, { dateStyle: 'full' })}, ${String(hour).padStart(2, '0')}:00`}
                                onClick={() => selectCalendarSlot(date, hour)}
                                disabled={dateKey < todayKey}
                              />
                            ))}
                          </div>
                          {dayBookings.map((booking, index) => {
                            const start = getBookingMinutes(booking.startTime)
                            const end = getBookingMinutes(booking.endTime)
                            const top = start / 60 * HOUR_HEIGHT
                            const height = Math.max(25, (end - start) / 60 * HOUR_HEIGHT - 3)
                            const lane = bookingLanes.get(booking)

                            return (
                              <article
                                className={`${styles.bookingBlock} ${styles[reservationColors[index % reservationColors.length]]}`}
                                key={booking.id}
                                style={{
                                  top: `${top}px`,
                                  height: `${height}px`,
                                  left: `calc(${lane.lane / lane.laneCount * 100}% + 3px)`,
                                  width: `calc(${lane.span / lane.laneCount * 100}% - 6px)`,
                                }}
                                title={`${booking.areaName}, ${booking.startTime}–${booking.endTime}, ${booking.residentName}`}
                              >
                                <strong>{booking.areaName}</strong>
                                <span>{booking.residentName}</span>
                                <small>{booking.startTime}–{booking.endTime}</small>
                              </article>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </section>

            <aside className={styles.reservationPanel}>
              <h2>Nova reserva</h2>
              <p className={styles.formIntro}>Preencha os dados para reservar uma área.</p>

              {areasError ? (
                <div className={styles.stateMessage} role="alert">{areasError}</div>
              ) : isLoadingAreas ? (
                <div className={styles.stateMessage}>Carregando áreas comuns...</div>
              ) : numberedAreas.length === 0 ? (
                <div className={styles.stateMessage}>
                  Nenhuma área comum cadastrada para este condomínio.
                  <Link to="/settings?section=areas">Ver áreas comuns</Link>
                </div>
              ) : (
                <form className={styles.reservationForm} onSubmit={handleCreateBooking}>
                  <label className={styles.field}>
                    <span>Dia</span>
                    <input
                      type="date"
                      value={selectedDate}
                      min={todayKey}
                      onChange={(event) => setSelectedDate(event.target.value)}
                      required
                    />
                  </label>

                  <div className={styles.timeFields}>
                    <label className={styles.field}>
                      <span>Início</span>
                      <select
                        value={selectedStart}
                        onChange={(event) => handleStartTimeChange(event.target.value)}
                        required
                      >
                        {areaTimeRange.options.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span>Fim</span>
                      <select
                        value={selectedEnd}
                        onChange={(event) => setSelectedEnd(event.target.value)}
                        required
                      >
                        {endTimeOptions.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className={styles.field}>
                    <span>Área</span>
                    <select
                      value={selectedAreaId}
                      onChange={(event) => handleAreaChange(event.target.value)}
                      required
                    >
                      {numberedAreas.map((area) => (
                        <option key={area.id} value={String(area.id)}>{area.displayName}</option>
                      ))}
                    </select>
                  </label>

                  <p className={isSelectedDayOpen && isSelectedTimeOpen && !hasTimeConflict
                    ? styles.availableMessage
                    : styles.unavailableMessage}
                  >
                    {!isSelectedDayOpen
                      ? 'Área indisponível neste dia da semana.'
                      : !isSelectedTimeOpen
                        ? 'Escolha um horário dentro do funcionamento da área.'
                        : hasTimeConflict
                          ? 'Já existe uma reserva nesse horário para esta área.'
                          : 'Área disponível no horário escolhido.'}
                  </p>

                  <p className={styles.localNotice}>
                    As reservas desta versão são exibidas apenas nesta sessão.
                  </p>
                  <button
                    className={styles.submitButton}
                    type="submit"
                    disabled={!isSelectedDayOpen || !isSelectedTimeOpen || Boolean(hasTimeConflict)}
                  >
                    <Plus size={17} weight="bold" />
                    Criar reserva
                  </button>
                </form>
              )}
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}