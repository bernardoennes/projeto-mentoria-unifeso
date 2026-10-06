const HALF_HOUR = 30

export function getDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateKey(dateKey) {
  return new Date(`${dateKey}T12:00:00`)
}

export function getWeekDates(dateKey) {
  const selectedDate = parseDateKey(dateKey)
  const monday = new Date(selectedDate)
  monday.setDate(selectedDate.getDate() - ((selectedDate.getDay() + 6) % 7))

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return date
  })
}

export function formatDate(date, options) {
  return new Intl.DateTimeFormat('pt-BR', options).format(date)
}

export function getMonthCells(monthDate) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()
  const cellCount = Math.ceil((firstDay.getDay() + daysInMonth) / 7) * 7

  return Array.from({ length: cellCount }, (_, index) => {
    const day = index - firstDay.getDay() + 1
    return day < 1 || day > daysInMonth
      ? null
      : new Date(monthDate.getFullYear(), monthDate.getMonth(), day)
  })
}

export function getDayLabel(dateKey, todayKey, selectedDate) {
  if (dateKey === todayKey) {
    return 'Hoje'
  }

  const tomorrow = parseDateKey(todayKey)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (dateKey === getDateKey(tomorrow)) {
    return 'Amanhã'
  }

  const eventDate = parseDateKey(dateKey)
  const selectedDay = parseDateKey(selectedDate)
  const crossesMonth = eventDate.getMonth() !== selectedDay.getMonth()
    || eventDate.getFullYear() !== selectedDay.getFullYear()

  return formatDate(eventDate, {
    weekday: 'short',
    day: 'numeric',
    ...(crossesMonth ? { month: 'short' } : {}),
  })
}

export function getMonthLabel(date) {
  const label = formatDate(date, { month: 'long', year: 'numeric' })
  return label.charAt(0).toLocaleUpperCase('pt-BR') + label.slice(1)
}

export function toMinutes(value, fallback) {
  const time = String(value ?? fallback).slice(0, 5)
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function toTimeValue(minutes) {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`
}

export function getAreaTimeOptions(area) {
  const start = toMinutes(area?.start_hour, '06:00')
  const end = toMinutes(area?.end_hour, '23:00')
  const options = []

  for (let minute = start; minute + HALF_HOUR <= end; minute += HALF_HOUR) {
    options.push(toTimeValue(minute))
  }

  return { start, end, options }
}

export function getSuggestedTimes(area) {
  const { options, end } = getAreaTimeOptions(area)
  const start = options[0] ?? ''
  const endOptions = [...options.filter((time) => toMinutes(time) > toMinutes(start)), toTimeValue(end)]
  const finish = endOptions.find((time) => toMinutes(time) >= toMinutes(start) + 120)
    ?? endOptions.at(-1)
    ?? ''

  return { start, end: finish }
}

export function isAreaOpenOnDate(area, date) {
  const availableWeekdays = area?.available_weekdays

  if (!Array.isArray(availableWeekdays)) {
    return true
  }

  const weekday = date.getDay() === 0 ? 7 : date.getDay()
  return availableWeekdays.map(Number).includes(weekday)
}

export function getBookingMinutes(value) {
  return toMinutes(value, '00:00')
}

export function getBookingLanes(bookingsForDay) {
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