const RESERVATIONS_CHANGED_EVENT = 'condominio:reservations-changed'

function getReservationsStorageKey(organisationId) {
  return `condominio:reservations:${organisationId}`
}

export function getCalendarReservations(organisationId) {
  if (!organisationId) {
    return []
  }

  try {
    const storedReservations = localStorage.getItem(getReservationsStorageKey(organisationId))
    const reservations = storedReservations ? JSON.parse(storedReservations) : []
    return Array.isArray(reservations) ? reservations : []
  } catch {
    return []
  }
}

export function createLocalCalendarReservation(organisationId, reservation) {
  if (!organisationId) {
    return []
  }

  const reservations = [...getCalendarReservations(organisationId), reservation]
  saveCalendarReservations(organisationId, reservations)
  return reservations
}

export function updateLocalCalendarReservation(organisationId, reservationId, updates) {
  if (!organisationId) {
    return []
  }

  const currentReservations = getCalendarReservations(organisationId)
  const reservationExists = currentReservations.some((reservation) => (
    String(reservation.id) === String(reservationId)
  ))

  if (!reservationExists) {
    throw new Error('A reserva não foi encontrada. Atualize a agenda e tente novamente.')
  }

  const reservations = currentReservations.map((reservation) => (
    String(reservation.id) === String(reservationId)
      ? { ...reservation, ...updates }
      : reservation
  ))
  saveCalendarReservations(organisationId, reservations)
  return reservations
}

export function deleteLocalCalendarReservation(organisationId, reservationId) {
  if (!organisationId) {
    return []
  }

  const currentReservations = getCalendarReservations(organisationId)
  const reservations = currentReservations
    .filter((reservation) => String(reservation.id) !== String(reservationId))

  if (reservations.length === currentReservations.length) {
    throw new Error('A reserva não foi encontrada. Atualize a agenda e tente novamente.')
  }

  saveCalendarReservations(organisationId, reservations)
  return reservations
}

function saveCalendarReservations(organisationId, reservations) {
  try {
    localStorage.setItem(getReservationsStorageKey(organisationId), JSON.stringify(reservations))
  } catch (error) {
    throw new Error('Não foi possível salvar a reserva neste navegador.', { cause: error })
  }

  window.dispatchEvent(new CustomEvent(RESERVATIONS_CHANGED_EVENT, {
    detail: { organisationId: String(organisationId) },
  }))
}

export function subscribeToCalendarReservations(organisationId, onChange) {
  if (!organisationId) {
    return () => {}
  }

  const storageKey = getReservationsStorageKey(organisationId)
  const handleChange = (event) => {
    if (event.type === 'storage' && event.key !== storageKey) {
      return
    }

    if (
      event.type === RESERVATIONS_CHANGED_EVENT
      && event.detail?.organisationId !== String(organisationId)
    ) {
      return
    }

    onChange(getCalendarReservations(organisationId))
  }

  window.addEventListener('storage', handleChange)
  window.addEventListener(RESERVATIONS_CHANGED_EVENT, handleChange)

  return () => {
    window.removeEventListener('storage', handleChange)
    window.removeEventListener(RESERVATIONS_CHANGED_EVENT, handleChange)
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