import { useEffect, useMemo, useState } from 'react'
import { Bell, WarningCircle } from '@phosphor-icons/react'
import Header from '../../components/Header/Header.jsx'
import MonthlyCalendar from '../../components/MonthlyCalendar/MonthlyCalendar.jsx'
import Sidebar from '../../components/Sidebar/Sidebar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import useCommonAreas from '../../hooks/useCommonAreas.js'
import { fetchCalendarReservations, getNationalHolidays } from '../../services/calendarService.js'
import { getNumberedAreas } from '../../utils/reservationUtils.js'
import styles from './HomePage.module.css'

export default function HomePage() {
  const { user, membership } = useAuth()
  const organisationId = membership?.organisation_id
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [reservationState, setReservationState] = useState({ requestKey: '', reservations: [], error: '' })
  const [reservationRequestId, setReservationRequestId] = useState(0)
  const commonAreas = useCommonAreas(organisationId)
  const areas = useMemo(() => getNumberedAreas(commonAreas.areas), [commonAreas.areas])
  const requestKey = `${organisationId ?? ''}:${areas.map((area) => area.id).join(',')}:${reservationRequestId}`

  const overlayClass = isSidebarExpanded ? ` ${styles.overlayVisible}` : ''
  const userName = user?.name ?? 'Morador'
  const greetingName = userName.trim().split(/\s+/)[0] || 'Morador'
  const reservations = useMemo(() => (
    reservationState.requestKey === requestKey ? reservationState.reservations : []
  ), [requestKey, reservationState])
  const reservationsLoading = !commonAreas.error
    && (commonAreas.isLoading || reservationState.requestKey !== requestKey)
  const reservationsError = commonAreas.error
    || (reservationState.requestKey === requestKey ? reservationState.error : '')

  const holidays = useMemo(() => [
    ...getNationalHolidays(new Date().getFullYear()),
    ...getNationalHolidays(new Date().getFullYear() + 1),
  ], [])

  const calendarEvents = useMemo(() => [
    ...holidays,
    ...reservations.map((reservation) => ({
      ...reservation,
      id: `reservation-${reservation.id}`,
      title: reservation.areaName,
      type: 'reservation',
      detail: `${reservation.startTime} · Reserva de área comum`,
    })),
  ].sort((first, second) => (
    first.date.localeCompare(second.date)
    || String(first.startTime ?? '').localeCompare(String(second.startTime ?? ''))
  )), [holidays, reservations])

  useEffect(() => {
    if (commonAreas.isLoading || commonAreas.error) {
      return undefined
    }

    let isCurrent = true
    async function loadReservations() {
      try {
        const nextReservations = await fetchCalendarReservations(organisationId, areas)
        if (isCurrent) {
          setReservationState({ requestKey, reservations: nextReservations, error: '' })
        }
      } catch (error) {
        if (isCurrent) {
          setReservationState({
            requestKey,
            reservations: [],
            error: error?.message ?? 'Não foi possível carregar as reservas.',
          })
        }
      }
    }

    loadReservations()
    return () => {
      isCurrent = false
    }
  }, [organisationId, areas, commonAreas.error, commonAreas.isLoading, requestKey])

  const retryReservations = () => {
    if (commonAreas.error) {
      commonAreas.retry()
      return
    }

    setReservationRequestId((id) => id + 1)
  }

  return (
    <div className={styles.pageShell}>
      <Header
        userName={userName}
        accessType={membership?.access_type ?? 'Não definido'}
        navigationExpanded={isSidebarExpanded}
        onNavigationToggle={setIsSidebarExpanded}
      />

      <div className={styles.pageBody}>
        <button
          type="button"
          className={`${styles.pageOverlay}${overlayClass}`}
          aria-label="Fechar navegação"
          aria-hidden={!isSidebarExpanded}
          tabIndex={isSidebarExpanded ? 0 : -1}
          onClick={() => setIsSidebarExpanded(false)}
        />

        <Sidebar
          expanded={isSidebarExpanded}
          onExpand={() => setIsSidebarExpanded(true)}
          onCollapse={() => setIsSidebarExpanded(false)}
          activeId="home"
          userName={userName}
          accessType={membership?.access_type ?? 'Não definido'}
        />

        <main className={styles.homeContent}>
          <div className={styles.welcomeBlock}>
            <h1>Olá, {greetingName}!</h1>
          </div>

          <section className={styles.dashboardGrid} aria-label="Resumo do condomínio">
            <section className={`${styles.dashboardPanel} ${styles.noticesPanel}`}>
              <header className={styles.panelHeading}>
                <span className={styles.iconBadge}><Bell size={17} weight="bold" /></span>
                <h2>Avisos</h2>
              </header>
              <p className={styles.implementationState}>Faltando implementação</p>
            </section>

            <div className={styles.calendarGridItem}>
              {reservationsError && !reservationsLoading && (
                <div className={styles.calendarError} role="alert">
                  <span>{reservationsError}</span>
                  <button type="button" onClick={retryReservations}>Tentar novamente</button>
                </div>
              )}
              <MonthlyCalendar events={calendarEvents} isLoading={reservationsLoading} />
            </div>

            <section className={`${styles.dashboardPanel} ${styles.occurrencesPanel}`}>
              <header className={styles.panelHeading}>
                <span className={styles.iconBadge}><WarningCircle size={17} weight="bold" /></span>
                <h2>Ocorrências</h2>
              </header>
              <p className={styles.implementationState}>Faltando implementação</p>
            </section>
          </section>
        </main>
      </div>
    </div>
  )
}
