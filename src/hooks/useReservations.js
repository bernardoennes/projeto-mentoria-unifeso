import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  deleteCalendarReservation,
  fetchCalendarReservations,
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
  const [reservationState, setReservationState] = useState({
    organisationId,
    reservations: [],
    isLoading: true,
    error: '',
  })
  const [reservationRequestId, setReservationRequestId] = useState(0)
  const [selectedBookingIds, setSelectedBookingIds] = useState([])
  const [selectedBookingIndex, setSelectedBookingIndex] = useState(0)
  const [reservationToDelete, setReservationToDelete] = useState(null)

  const areas = useMemo(() => getNumberedAreas(commonAreas.areas), [commonAreas.areas])
  const bookings = useMemo(() => (
    reservationState.organisationId === organisationId
      ? reservationState.reservations
      : []
  ), [organisationId, reservationState])
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

  useEffect(() => {
    if (commonAreas.isLoading || commonAreas.error) {
      return undefined
    }

    let isCurrent = true
    async function loadReservations() {
      try {
        const nextReservations = await fetchCalendarReservations(organisationId, areas)
        if (isCurrent) {
          setReservationState({
            organisationId,
            reservations: nextReservations,
            isLoading: false,
            error: '',
          })
        }
      } catch (error) {
        if (isCurrent) {
          setReservationState((current) => ({
            organisationId,
            reservations: current.organisationId === organisationId ? current.reservations : [],
            isLoading: false,
            error: error?.message ?? 'Não foi possível carregar as reservas.',
          }))
        }
      }
    }

    loadReservations()
    return () => {
      isCurrent = false
    }
  }, [organisationId, areas, commonAreas.error, commonAreas.isLoading, reservationRequestId])

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
    onSaved: (reservation) => {
      setReservationState((current) => ({
        organisationId,
        reservations: [
          ...(current.organisationId === organisationId ? current.reservations : [])
            .filter((booking) => String(booking.id) !== String(reservation.id)),
          reservation,
        ],
        isLoading: false,
        error: '',
      }))
      showBookings([reservation])
    },
  })

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

  const confirmDelete = async () => {
    if (!reservationToDelete) {
      return
    }

    if (!canManageBooking(reservationToDelete)) {
      toast.error('Você não tem permissão para excluir esta reserva.')
      setReservationToDelete(null)
      return
    }

    try {
      await deleteCalendarReservation(reservationToDelete.id)
    } catch (error) {
      toast.error(error?.message ?? 'Não foi possível excluir a reserva.')
      return
    }
    setReservationState((current) => ({
      organisationId,
      reservations: (current.organisationId === organisationId ? current.reservations : []).filter((booking) => (
        String(booking.id) !== String(reservationToDelete.id)
      )),
      isLoading: false,
      error: '',
    }))
    showBookings([])
    setReservationToDelete(null)
    toast.success('Reserva excluída.')
  }

  const retryReservations = () => {
    setReservationState((current) => ({
      ...current,
      isLoading: true,
      error: '',
    }))
    setReservationRequestId((id) => id + 1)
  }

  return {
    areas,
    areasState: {
      ...commonAreas,
        reservationsLoading: !commonAreas.isLoading
          && !commonAreas.error
          && (reservationState.organisationId !== organisationId || reservationState.isLoading),
      reservationsError: reservationState.organisationId === organisationId
        ? reservationState.error
        : '',
      retryReservations,
    },
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
