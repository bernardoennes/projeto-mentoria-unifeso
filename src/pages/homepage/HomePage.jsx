import { useEffect, useMemo, useState } from 'react'
import { Bell, WarningCircle } from '@phosphor-icons/react'
import Header from '../../components/Header/Header.jsx'
import MonthlyCalendar from '../../components/MonthlyCalendar/MonthlyCalendar.jsx'
import Sidebar from '../../components/Sidebar/Sidebar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  getCalendarReservations,
  getNationalHolidays,
  subscribeToCalendarReservations,
} from '../../services/calendarService.js'
import styles from './HomePage.module.css'

export default function HomePage() {
  const { user, membership } = useAuth()
  const organisationId = membership?.organisation_id
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [reservationState, setReservationState] = useState(() => ({
    organisationId,
    reservations: getCalendarReservations(organisationId),
  }))

  const overlayClass = isSidebarExpanded ? ` ${styles.overlayVisible}` : ''
  const userName = user?.name ?? 'Morador'
  const reservations = reservationState.organisationId === organisationId
    ? reservationState.reservations
    : getCalendarReservations(organisationId)
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
    return subscribeToCalendarReservations(organisationId, (nextReservations) => {
      setReservationState({ organisationId, reservations: nextReservations })
    })
  }, [organisationId])

  return (
    <div className={styles.pageShell}>
      <Header
        title="Condomínio"
        subtitle="Sistema de Gerenciamento"
        userName={userName}
        accessType={membership?.access_type ?? 'Não definido'}
      />

      <div className={styles.pageBody}>
        <div className={`${styles.pageOverlay}${overlayClass}`} />

        <Sidebar
          expanded={isSidebarExpanded}
          onExpand={() => setIsSidebarExpanded(true)}
          onCollapse={() => setIsSidebarExpanded(false)}
          activeId="home"
        />

        <main className={styles.homeContent}>
          <div className={styles.welcomeBlock}>
            <h1>Bem-vindo, {userName}</h1>
            <p>Acompanhe os próximos compromissos do condomínio.</p>
          </div>

          <section className={styles.dashboardGrid} aria-label="Resumo do condomínio">
            <section className={styles.dashboardPanel}>
              <header className={styles.panelHeading}>
                <span className={styles.iconBadge}><Bell size={17} weight="bold" /></span>
                <h2>Avisos</h2>
              </header>
              <p className={styles.implementationState}>Faltando implementação</p>
            </section>

            <MonthlyCalendar events={calendarEvents} />

            <section className={styles.dashboardPanel}>
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
