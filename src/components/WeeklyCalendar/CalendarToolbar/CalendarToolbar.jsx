import { CaretLeft, CaretRight, Funnel, Plus } from '@phosphor-icons/react'
import { useState } from 'react'
import BrickLoader from '../../BrickLoader/BrickLoader.jsx'
import Select from '../../Select/Select.jsx'
import styles from './CalendarToolbar.module.css'

export default function CalendarToolbar({
  areas,
  isLoadingAreas,
  areasError,
  isLoadingReservations,
  reservationsError,
  weekLabel,
  filterAreaId,
  onFilterChange,
  onNewReservation,
  onRetryAreas,
  onRetryReservations,
  onToday,
  onChangeWeek,
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  return (
    <div className={styles.toolbar}>
      <button
        type="button"
        className={styles.createReservationButton}
        onClick={onNewReservation}
        disabled={isLoadingAreas || Boolean(areasError) || isLoadingReservations || Boolean(reservationsError)}
      >
        <Plus size={17} weight="bold" aria-hidden="true" />
        Nova reserva
      </button>
      {isLoadingAreas && (
        <span className={styles.loadingAreas} role="status">
          <BrickLoader size="sm" inline />
          Carregando áreas...
        </span>
      )}
      {areasError && !isLoadingAreas && (
        <div className={styles.areasError} role="alert">
          <span>{areasError}</span>
          <button type="button" onClick={onRetryAreas}>Tentar novamente</button>
        </div>
      )}
      {isLoadingReservations && (
        <span className={styles.loadingAreas} role="status">
          <BrickLoader size="sm" inline />
          Carregando reservas...
        </span>
      )}
      {reservationsError && !isLoadingReservations && (
        <div className={styles.areasError} role="alert">
          <span>{reservationsError}</span>
          <button type="button" onClick={onRetryReservations}>Tentar novamente</button>
        </div>
      )}
      <div className={styles.controls}>
        <button type="button" className={styles.todayButton} onClick={onToday}>
          Hoje
        </button>
        <div className={styles.weekNavigator} aria-label="Navegação da semana">
          <button type="button" aria-label="Semana anterior" onClick={() => onChangeWeek(-1)}>
            <CaretLeft size={17} weight="bold" />
          </button>
          <span>{weekLabel}</span>
          <button type="button" aria-label="Próxima semana" onClick={() => onChangeWeek(1)}>
            <CaretRight size={17} weight="bold" />
          </button>
        </div>
        <div className={styles.filterWrap}>
          <button
            type="button"
            className={styles.filterButton}
            aria-label="Filtrar reservas por área"
            aria-expanded={isFilterOpen}
            onClick={() => setIsFilterOpen((current) => !current)}
          >
            <Funnel size={18} />
          </button>
          {isFilterOpen && (
            <label className={styles.filterPopover}>
              <span>Exibir área</span>
              <Select
                value={filterAreaId}
                onChange={onFilterChange}
                options={[
                  { value: 'all', label: 'Todas as áreas' },
                  ...areas.map((area) => ({ value: String(area.id), label: area.displayName })),
                ]}
              />
            </label>
          )}
        </div>
      </div>
    </div>
  )
}
