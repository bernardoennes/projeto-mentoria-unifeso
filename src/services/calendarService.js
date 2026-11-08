import { supabase } from '../lib/supabase.js'
import { getRequestError } from './edgeFunctionError.js'
import { AREA_TYPE_LABELS } from './commonAreaService.js'

function formatApiTime(date, time) {
  const dateTime = new Date(`${date}T${time}:00`)
  const offsetMinutes = dateTime.getTimezoneOffset()
  const sign = offsetMinutes <= 0 ? '+' : '-'
  const absoluteOffset = Math.abs(offsetMinutes)
  const offset = `${sign}${String(Math.floor(absoluteOffset / 60)).padStart(2, '0')}:${String(absoluteOffset % 60).padStart(2, '0')}`
  return `${time}:00${offset}`
}

function mapApiReservation(reservation, areas, profiles) {
  const area = areas.find((item) => String(item.id) === String(reservation.reserved_area))
  const profile = profiles.find((item) => String(item.id) === String(reservation.reserved_by))

  return {
    id: String(reservation.id),
    areaId: String(reservation.reserved_area),
    areaName: area?.displayName ?? AREA_TYPE_LABELS[area?.area_type] ?? 'Área comum',
    date: String(reservation.date).slice(0, 10),
    startTime: String(reservation.start_date).slice(0, 5),
    endTime: String(reservation.end_date).slice(0, 5),
    residentName: profile?.name ?? 'Morador',
    userId: reservation.reserved_by ? String(reservation.reserved_by) : null,
    isEvent: Boolean(reservation.is_event),
    numberOfPeople: reservation.participants,
    observations: reservation.observations ?? '',
  }
}

export async function fetchCalendarReservations(organisationId, areas) {
  if (!organisationId || areas.length === 0) {
    return []
  }

  const areaIds = areas.map((area) => String(area.id))
  const { data, error } = await supabase
    .from('reservations')
    .select('id, reserved_by, reserved_area, date, start_date, end_date, is_event, participants, observations')
    .eq('is_deleted', false)
    .in('reserved_area', areaIds)

  if (error) {
    throw getRequestError(error, 'Não foi possível carregar as reservas. Tente novamente.')
  }

  const reservations = data ?? []
  const userIds = [...new Set(reservations
    .map((reservation) => reservation.reserved_by)
    .filter(Boolean)
    .map(String))]
  let profiles = []

  if (userIds.length > 0) {
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles_safe')
      .select('id, name')
      .in('id', userIds)

    if (profileError) {
      throw getRequestError(profileError, 'Não foi possível carregar os responsáveis pelas reservas.')
    }

    profiles = profileData ?? []
  }

  return reservations.map((reservation) => mapApiReservation(reservation, areas, profiles))
}

export async function saveCalendarReservation({ organisationId, reservation, area, profile, isEvent }) {
  if (!organisationId) {
    throw new Error('Não foi possível identificar o condomínio desta reserva.')
  }

  const isEditing = Boolean(reservation.id)
  const body = isEditing
    ? {
      action: 'update',
      id: String(reservation.id),
      start_date: formatApiTime(reservation.date, reservation.startTime),
      end_date: formatApiTime(reservation.date, reservation.endTime),
      is_event: isEvent,
      participants: reservation.numberOfPeople,
      observations: reservation.observations,
    }
    : {
      action: 'create',
      reserved_area: String(area.id),
      date: reservation.date,
      start_date: formatApiTime(reservation.date, reservation.startTime),
      end_date: formatApiTime(reservation.date, reservation.endTime),
      is_event: isEvent,
      participants: reservation.numberOfPeople,
      observations: reservation.observations,
    }
  const { data, error } = await supabase.functions.invoke('manage-reservations', { body })

  if (error) {
    throw getRequestError(error, 'Não foi possível salvar a reserva. Tente novamente.')
  }

  if (!data?.reservation) {
    throw new Error('A API não retornou os dados da reserva salva.')
  }

  return mapApiReservation(data.reservation, [area], [{
    id: reservation.userId ?? profile?.id,
    name: reservation.residentName ?? profile?.name,
  }])
}

export async function deleteCalendarReservation(reservationId) {
  const { error } = await supabase.functions.invoke('manage-reservations', {
    body: {
      action: 'delete',
      id: String(reservationId),
    },
  })

  if (error) {
    throw getRequestError(error, 'Não foi possível excluir a reserva. Tente novamente.')
  }
}

export function getNationalHolidays(year) {
  const holidays = [
    ['01-01', 'Confraternização Universal'],
    ['04-21', 'Tiradentes'],
    ['05-01', 'Dia Mundial do Trabalho'],
    ['09-07', 'Independência do Brasil'],
    ['10-12', 'Nossa Senhora Aparecida'],
    ['11-02', 'Finados'],
    ['11-15', 'Proclamação da República'],
    ['11-20', 'Dia Nacional de Zumbi e da Consciência Negra'],
    ['12-25', 'Natal'],
  ]

  return holidays.map(([monthDay, title]) => ({
    id: `holiday-${year}-${monthDay}`,
    date: `${year}-${monthDay}`,
    title,
    type: 'holiday',
  }))
}