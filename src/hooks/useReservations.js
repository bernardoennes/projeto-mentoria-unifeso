import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  deleteLocalCalendarReservation,
  getCalendarReservations,
  subscribeToCalendarReservations,
} from '../services/calendarService.js'
import {
  formatDate,
  getBookingMinutes,
  getDateKey,
  getWeekDates,
  parseDateKey,
} from '../utils/calendarUtils.js'
import {
  canManageBooking as canUserManageBooking,
  compareBookingPriority,
  getBookingGroups,
  getNumberedAreas,
} from '../utils/reservationUtils.js'
import useCommonAreas from './useCommonAreas.js'
import useReservationForm from './useReservationForm.js'

export default function useReservations({ organisationId, profile, isSyndic }) {
  const [searchParams] = useSearchParams()
  const shouldOpenNewReservation = searchParams.get('newReservation') === 'true'
  const commonAreas = useCommonAreas(organisationId)
  const [selectedDate, setSelectedDate] = useState(() => {
    const dateParam = searchParams.get('date')
    return /^\d{4}-\d{2}-\d{2}$/.test(dateParam ?? '') ? dateParam : getDateKey(new Date())
  })
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [filterAreaId, setFilterAreaId] = useState('all')
  const [reservationState, setReservationState] = useState(() => ({
    organisationId,
    reservations: getCalendarReservations(organisationId),
  }))
  const [selectedBookingIds, setSelectedBookingIds] = useState([])
  const [selectedBookingIndex, setSelectedBookingIndex] = useState(0)
  const [reservationToDelete, setReservationToDelete] = useState(null)

  const areas = useMemo(() => getNumberedAreas(commonAreas.areas), [commonAreas.areas])
  const bookings = reservationState.organisationId === organisationId
    ? reservationState.reservations
    : getCalendarReservations(organisationId)
  const todayKey = getDateKey(new Date())
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate])
  const weekLabel = `${formatDate(weekDates[0], { day: 'numeric' })} – ${formatDate(weekDates[6], {
    day: 'numeric',
    month: 'short',
  })} ${weekDates[6].getFullYear()}`

  const canManageBooking = (booking) => canUserManageBooking(booking, { isSyndic, profile })
  const sortManageableFirst = (items) => [...items].sort((first, second) => (
    Number(canManageBooking(second)) - Number(canManageBooking(first))
    || compareBookingPriority(first, second)
  ))

  const filteredBookings = useMemo(() => bookings.filter((booking) => (
    filterAreaId === 'all' || String(booking.areaId) === filterAreaId
  )), [bookings, filterAreaId])
  const bookingGroupsByDate = useMemo(() => new Map(weekDates.map((date) => {
    const dateKey = getDateKey(date)
    return [dateKey, getBookingGroups(filteredBookings.filter((booking) => booking.date === dateKey))]
  })), [filteredBookings, weekDates])
  const selectedBookings = useMemo(() => selectedBookingIds
    .map((id) => bookings.find((booking) => String(booking.id) === String(id)))
    .filter(Boolean), [bookings, selectedBookingIds])
  const selectedBooking = selectedBookings[selectedBookingIndex]

  const showBookings = (items) => {
    setSelectedBookingIds(items.map((booking) => booking.id))
    setSelectedBookingIndex(0)
  }

  const form = useReservationForm({
    organisationId,
    profile,
    isSyndic,
    areas,
    areasError: commonAreas.error,
    isLoadingAreas: commonAreas.isLoading,
    bookings,
    selectedDate,
    onDateChange: setSelectedDate,
    todayKey,
    canManageBooking,
    openOnMount: shouldOpenNewReservation,
    onSaved: (nextReservations, reservation) => {
      setReservationState({ organisationId, reservations: nextReservations })
      showBookings([reservation])
    },
  })

  useEffect(() => {
    return subscribeToCalendarReservations(organisationId, (nextReservations) => {
      setReservationState({ organisationId, reservations: nextReservations })
    })
  }, [organisationId])

  const selectDay = (dateKey) => {
    setSelectedDate(dateKey)
    setSelectedSlot(null)
  }

  const changeWeek = (offset) => {
    const nextDate = parseDateKey(selectedDate)
    nextDate.setDate(nextDate.getDate() + offset * 7)
    selectDay(getDateKey(nextDate))
  }

  const selectSlot = (date, hour) => {
    const dateKey = getDateKey(date)
    const intervalStart = hour * 60
    const intervalEnd = intervalStart + 60

    setSelectedDate(dateKey)
    setSelectedSlot({ dateKey, hour })
    showBookings(sortManageableFirst(filteredBookings.filter((booking) => (
      booking.date === dateKey
      && getBookingMinutes(booking.startTime) < intervalEnd
      && getBookingMinutes(booking.endTime) > intervalStart
    ))))

    if (dateKey >= todayKey) {
      form.suggestTimesFromHour(hour)
    }
  }

  const selectGroup = (group, firstBookingId) => {
    const groupBookings = sortManageableFirst(group.bookings)
    const firstBooking = groupBookings.find((booking) => String(booking.id) === String(firstBookingId))
    showBookings(firstBooking && canManageBooking(firstBooking)
      ? [firstBooking, ...groupBookings.filter((booking) => booking !== firstBooking)]
      : groupBookings)
  }

  const confirmDelete = () => {
    if (!reservationToDelete) {
      return
    }

    if (!canManageBooking(reservationToDelete)) {
      toast.error('Você não tem permissão para excluir esta reserva.')
      setReservationToDelete(null)
      return
    }

    let nextReservations
    try {
      nextReservations = deleteLocalCalendarReservation(organisationId, reservationToDelete.id)
    } catch (error) {
      toast.error(error?.message ?? 'Não foi possível excluir a reserva.')
      return
    }
    setReservationState({ organisationId, reservations: nextReservations })
    showBookings([])
    setReservationToDelete(null)
    toast.success('Reserva excluída.')
  }

  return {
    areas,
    areasState: commonAreas,
    form,
    weekDates,
    weekLabel,
    todayKey,
    filterAreaId,
    setFilterAreaId,
    bookingGroupsByDate,
    selectedSlot,
    selectedBookingIds,
    selectedBookings,
    selectedBooking,
    selectedBookingIndex,
    setSelectedBookingIndex,
    canManageSelectedBooking: canManageBooking(selectedBooking),
    reservationToDelete,
    setReservationToDelete,
    confirmDelete,
    selectDay,
    changeWeek,
    selectSlot,
    selectGroup,
  }
}
