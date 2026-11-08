import { AREA_TYPE_LABELS } from '../services/commonAreaService.js'
import { getBookingMinutes } from './calendarUtils.js'

export function getNumberedAreas(areas) {
  const counts = new Map()
  const totals = areas.reduce((areaCounts, area) => (
    areaCounts.set(area.area_type, (areaCounts.get(area.area_type) ?? 0) + 1)
  ), new Map())

  return areas.map((area) => {
    const sequence = (counts.get(area.area_type) ?? 0) + 1
    counts.set(area.area_type, sequence)
    const label = AREA_TYPE_LABELS[area.area_type] ?? area.area_type

    return {
      ...area,
      displayName: totals.get(area.area_type) > 1
        ? `${label} ${sequence}`
        : label,
    }
  })
}

export function getBookingGroups(bookings) {
  const sortedBookings = [...bookings].sort((first, second) => (
    getBookingMinutes(first.startTime) - getBookingMinutes(second.startTime)
    || getBookingMinutes(second.endTime) - getBookingMinutes(first.endTime)
  ))
  const groups = []
  let currentBookings = []
  let groupEnd = -1

  const closeGroup = () => {
    groups.push({
      bookings: currentBookings,
      start: Math.min(...currentBookings.map((item) => getBookingMinutes(item.startTime))),
      end: groupEnd,
    })
  }

  for (const booking of sortedBookings) {
    const start = getBookingMinutes(booking.startTime)
    const end = getBookingMinutes(booking.endTime)

    if (currentBookings.length > 0 && start >= groupEnd) {
      closeGroup()
      currentBookings = []
      groupEnd = -1
    }

    currentBookings.push(booking)
    groupEnd = Math.max(groupEnd, end)
  }

  if (currentBookings.length > 0) {
    closeGroup()
  }

  return groups
}

export function compareBookingPriority(first, second) {
  return Number(Boolean(second.isEvent)) - Number(Boolean(first.isEvent))
    || (getBookingMinutes(second.endTime) - getBookingMinutes(second.startTime))
      - (getBookingMinutes(first.endTime) - getBookingMinutes(first.startTime))
    || getBookingMinutes(first.startTime) - getBookingMinutes(second.startTime)
}

export function normalizeResidentName(name) {
  return String(name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleUpperCase('pt-BR')
}

export function canManageBooking(booking, { isSyndic, profile }) {
  return Boolean(booking && (
    isSyndic
    || (booking.userId && String(booking.userId) === String(profile?.id))
    || (
      !booking.userId
      && normalizeResidentName(booking.residentName) === normalizeResidentName(profile?.name)
    )
  ))
}
