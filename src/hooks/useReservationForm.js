import { useState } from 'react'
import { toast } from 'react-toastify'
import {
  createLocalCalendarReservation,
  updateLocalCalendarReservation,
} from '../services/calendarService.js'
import {
  getAreaTimeOptions,
  getSuggestedTimes,
  isAreaOpenOnDate,
  parseDateKey,
  toMinutes,
  toTimeValue,
} from '../utils/calendarUtils.js'
import { normalizeResidentName } from '../utils/reservationUtils.js'

export default function useReservationForm({
  organisationId,
  profile,
  isSyndic,
  areas,
  areasError,
  isLoadingAreas,
  bookings,
  selectedDate,
  onDateChange,
  todayKey,
  canManageBooking,
  openOnMount = false,
  onSaved,
}) {
  const [isOpen, setIsOpen] = useState(openOnMount)
  const [editingReservation, setEditingReservation] = useState(null)
  const [selectedAreaId, setSelectedAreaId] = useState('')
  const [selectedStart, setSelectedStart] = useState('')
  const [selectedEnd, setSelectedEnd] = useState('')
  const [numberOfPeople, setNumberOfPeople] = useState('1')
  const [observations, setObservations] = useState('')
  const [isEvent, setIsEvent] = useState(false)

  const selectedArea = areas.find((area) => String(area.id) === selectedAreaId)
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
    if (editingReservation && String(booking.id) === String(editingReservation.id)) {
      return false
    }

    if (String(booking.areaId) !== selectedAreaId || booking.date !== selectedDate) {
      return false
    }

    return toMinutes(selectedStart) < toMinutes(booking.endTime)
      && toMinutes(selectedEnd) > toMinutes(booking.startTime)
  })
  const reservationOwnerId = editingReservation?.userId ?? profile?.id
  const reservationOwnerName = editingReservation?.residentName ?? profile?.name
  const hasResidentTimeConflict = bookings.some((booking) => {
    if (editingReservation && String(booking.id) === String(editingReservation.id)) {
      return false
    }

    if (booking.date !== selectedDate) {
      return false
    }

    const hasMatchingUserIds = reservationOwnerId && booking.userId
    const sameResident = hasMatchingUserIds
      ? String(reservationOwnerId) === String(booking.userId)
      : normalizeResidentName(reservationOwnerName) !== ''
        && normalizeResidentName(reservationOwnerName) === normalizeResidentName(booking.residentName)

    return sameResident
      && toMinutes(selectedStart) < toMinutes(booking.endTime)
      && toMinutes(selectedEnd) > toMinutes(booking.startTime)
  })

  const [syncedAreas, setSyncedAreas] = useState(areas)
  if (syncedAreas !== areas) {
    setSyncedAreas(areas)
    if (areas[0]) {
      const suggestedTimes = getSuggestedTimes(areas[0])
      setSelectedAreaId(String(areas[0].id))
      setSelectedStart(suggestedTimes.start)
      setSelectedEnd(suggestedTimes.end)
    }
  }

  const changeStart = (value) => {
    setSelectedStart(value)
    setSelectedEnd(endTimeOptions.find((time) => toMinutes(time) >= toMinutes(value) + 120)
      ?? endTimeOptions.find((time) => toMinutes(time) > toMinutes(value))
      ?? '')
  }

  const changeArea = (areaId) => {
    setSelectedAreaId(areaId)
    const suggestedTimes = getSuggestedTimes(areas.find((item) => String(item.id) === areaId))
    setSelectedStart(suggestedTimes.start)
    setSelectedEnd(suggestedTimes.end)
  }

  const suggestTimesFromHour = (hour) => {
    const clickedTime = `${String(hour).padStart(2, '0')}:00`
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

  const close = () => {
    setIsOpen(false)
    setEditingReservation(null)
  }

  const openNew = () => {
    setEditingReservation(null)
    setNumberOfPeople('1')
    setObservations('')
    setIsEvent(false)
    setIsOpen(true)
  }

  const openEdit = (booking) => {
    if (!booking || !canManageBooking(booking)) {
      return
    }

    setEditingReservation(booking)
    onDateChange(booking.date)
    setSelectedAreaId(String(booking.areaId))
    setSelectedStart(booking.startTime)
    setSelectedEnd(booking.endTime)
    setNumberOfPeople(String(booking.numberOfPeople ?? 1))
    setObservations(booking.observations ?? '')
    setIsEvent(Boolean(booking.isEvent))
    setIsOpen(true)
  }

  const getValidationError = () => {
    if (editingReservation && !canManageBooking(editingReservation)) {
      return 'Você não tem permissão para editar esta reserva.'
    }
    if (!selectedArea || !selectedStart || !selectedEnd) {
      return 'Selecione uma área e um horário para continuar.'
    }
    if (!editingReservation && selectedDate < todayKey) {
      return 'Não é possível reservar em uma data passada.'
    }
    if (!Number.isInteger(Number(numberOfPeople)) || Number(numberOfPeople) < 1) {
      return 'Informe um número válido de pessoas.'
    }
    if (!isSelectedDayOpen) {
      return 'Esta área não funciona no dia selecionado.'
    }
    if (!isSelectedTimeOpen) {
      return 'O horário escolhido está fora do período de funcionamento da área.'
    }
    if (hasResidentTimeConflict) {
      return 'Você já possui uma reserva em um horário que se sobrepõe neste dia.'
    }
    if (hasTimeConflict) {
      return 'Este horário já possui uma reserva para a área selecionada.'
    }
    return ''
  }

  const submit = (event) => {
    event.preventDefault()

    const validationError = getValidationError()
    if (validationError) {
      toast.error(validationError)
      return
    }

    const details = {
      startTime: selectedStart,
      endTime: selectedEnd,
      numberOfPeople: Number(numberOfPeople),
      observations: observations.trim(),
    }
    const reservation = editingReservation
      ? {
        ...editingReservation,
        ...details,
        userId: editingReservation.userId ?? profile?.id,
        isEvent: isSyndic ? isEvent : Boolean(editingReservation.isEvent),
      }
      : {
        ...details,
        id: `${Date.now()}`,
        areaId: selectedArea.id,
        areaName: selectedArea.displayName,
        date: selectedDate,
        residentName: profile?.name ?? 'Você',
        userId: profile?.id,
        isEvent: isSyndic && isEvent,
      }

    let nextReservations
    try {
      nextReservations = editingReservation
        ? updateLocalCalendarReservation(organisationId, editingReservation.id, reservation)
        : createLocalCalendarReservation(organisationId, reservation)
    } catch (error) {
      toast.error(error?.message ?? 'Não foi possível salvar a reserva.')
      return
    }

    onSaved(nextReservations, reservation)
    toast.success(editingReservation ? 'Reserva atualizada.' : 'Reserva adicionada à agenda.')
    close()
  }

  return {
    openNew,
    openEdit,
    suggestTimesFromHour,
    drawerProps: {
      open: isOpen,
      onClose: close,
      editingReservation,
      areasError,
      isLoadingAreas,
      areas,
      selectedDate,
      onDateChange,
      disableAreaAndDate: Boolean(editingReservation),
      todayKey,
      selectedStart,
      onStartChange: changeStart,
      startOptions: areaTimeRange.options.map((time) => ({ value: time, label: time })),
      selectedEnd,
      onEndChange: setSelectedEnd,
      endOptions: endTimeOptions.map((time) => ({ value: time, label: time })),
      selectedAreaId,
      onAreaChange: changeArea,
      numberOfPeople,
      onNumberOfPeopleChange: setNumberOfPeople,
      observations,
      onObservationsChange: setObservations,
      isEvent,
      onEventChange: setIsEvent,
      canCreateEvent: isSyndic,
      isSelectedDayOpen,
      isSelectedTimeOpen,
      hasTimeConflict,
      hasResidentTimeConflict,
      onSubmit: submit,
    },
  }
}
