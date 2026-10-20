import { useState } from 'react'
import DeleteReservationDialog from '../../components/DeleteReservationDialog/DeleteReservationDialog.jsx'
import Header from '../../components/Header/Header.jsx'
import NewReservationDrawer from '../../components/NewReservationDrawer/NewReservationDrawer.jsx'
import PageSubheader from '../../components/PageSubheader/PageSubheader.jsx'
import ReservationDetails from '../../components/ReservationDetails/ReservationDetails.jsx'
import Sidebar from '../../components/Sidebar/Sidebar.jsx'
import CalendarToolbar from '../../components/WeeklyCalendar/CalendarToolbar/CalendarToolbar.jsx'
import WeeklyCalendar from '../../components/WeeklyCalendar/WeeklyCalendar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import useReservations from '../../hooks/useReservations.js'
import { buildUserProfile } from '../../services/userService.js'
import { canManageCondominium } from '../../utils/permissions.js'
import styles from './ReservationPage.module.css'

export default function ReservationPage() {
  const { user, membership } = useAuth()
  const profile = buildUserProfile(user, membership)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const reservations = useReservations({
    organisationId: membership?.organisation_id,
    profile,
    isSyndic: canManageCondominium(membership),
  })
  const { areasState, form } = reservations
  const overlayClass = isSidebarExpanded ? ` ${styles.overlayVisible}` : ''

  return (
    <div className={styles.pageShell}>
      <Header
        userName={profile?.name ?? 'Usuário'}
        accessType={profile?.access_type ?? 'Não definido'}
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
          activeId="reservas"
          userName={profile?.name ?? 'Usuário'}
          accessType={profile?.access_type ?? 'Não definido'}
        />

        <main className={styles.content}>
          <PageSubheader
            className={styles.pageSubheader}
            title="Calendário de reservas"
            subtitle="Acompanhe a agenda e gerencie as reservas das áreas comuns."
          />
          <div className={styles.reservationArea}>
            <CalendarToolbar
              areas={reservations.areas}
              isLoadingAreas={areasState.isLoading}
              areasError={areasState.error}
              weekLabel={reservations.weekLabel}
              filterAreaId={reservations.filterAreaId}
              onFilterChange={reservations.setFilterAreaId}
              onNewReservation={form.openNew}
              onRetryAreas={areasState.retry}
              onToday={() => reservations.selectDay(reservations.todayKey)}
              onChangeWeek={reservations.changeWeek}
            />
            <div className={styles.calendarLayout}>
              <WeeklyCalendar
                weekDates={reservations.weekDates}
                todayKey={reservations.todayKey}
                bookingGroupsByDate={reservations.bookingGroupsByDate}
                selectedSlot={reservations.selectedSlot}
                selectedBookingIds={reservations.selectedBookingIds}
                onSelectDay={reservations.selectDay}
                onSelectSlot={reservations.selectSlot}
                onSelectGroup={reservations.selectGroup}
              />
              <ReservationDetails
                booking={reservations.selectedBooking}
                bookingCount={reservations.selectedBookings.length}
                bookingIndex={reservations.selectedBookingIndex}
                canManage={reservations.canManageSelectedBooking}
                onEdit={() => form.openEdit(reservations.selectedBooking)}
                onDelete={reservations.setReservationToDelete}
                onIndexChange={reservations.setSelectedBookingIndex}
              />
            </div>
          </div>
        </main>
      </div>

      <NewReservationDrawer {...form.drawerProps} />
      <DeleteReservationDialog
        reservation={reservations.reservationToDelete}
        onCancel={() => reservations.setReservationToDelete(null)}
        onConfirm={reservations.confirmDelete}
      />
    </div>
  )
}
