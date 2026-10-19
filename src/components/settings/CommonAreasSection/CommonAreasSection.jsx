import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarBlank, Clock, MagnifyingGlass, Plus } from '@phosphor-icons/react'
import { toast } from 'react-toastify'
import Select, { SORT_OPTIONS } from '../../Select/Select'
import styles from './CommonAreasSection.module.css'
import { AREA_TYPE_LABELS } from '../../../services/commonAreaService.js'

const weekdayOptions = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 7, label: 'Dom' },
]
const weekdayLabels = Object.fromEntries(weekdayOptions.map(({ value, label }) => [value, label]))

const initialForm = {
  areaType: 'SWIMMING_POOL',
  availableWeekdays: weekdayOptions.map(({ value }) => value),
  startHour: '',
  endHour: '',
}

function formatHour(hour) {
  return hour ? String(hour).slice(0, 5) : ''
}

function isHalfHourTime(hour) {
  return !hour || /^\d{2}:(00|30)$/.test(hour)
}

function AvailableWeekdays({ days }) {
  const containerRef = useRef(null)
  const [visibleCount, setVisibleCount] = useState(days.length)
  const labels = days.map((day) => weekdayLabels[day] ?? day)

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return undefined
    }

    const updateVisibleCount = () => {
      const availableWidth = container.clientWidth
      const chipWidth = 34
      const chipGap = 4
      const overflowWidth = 30
      const allDaysWidth = labels.length * chipWidth + Math.max(0, labels.length - 1) * chipGap

      if (allDaysWidth <= availableWidth) {
        setVisibleCount(labels.length)
        return
      }

      const visibleDays = Math.max(
        0,
        Math.floor((availableWidth - overflowWidth - chipGap) / (chipWidth + chipGap)),
      )
      setVisibleCount(Math.min(visibleDays, labels.length - 1))
    }

    updateVisibleCount()

    const resizeObserver = new ResizeObserver(updateVisibleCount)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [labels.length])

  return (
    <span
      ref={containerRef}
      className={styles.weekdayList}
      aria-label={`Dias disponíveis: ${labels.join(', ')}`}
    >
      {labels.slice(0, visibleCount).map((label, index) => (
        <span key={`${days[index]}-${index}`} className={styles.weekdayChip} aria-hidden="true">
          {label}
        </span>
      ))}
      {visibleCount < labels.length && (
        <span className={styles.weekdayOverflow} aria-hidden="true">
          +{labels.length - visibleCount}
        </span>
      )}
    </span>
  )
}

function getNumberedAreas(items) {
  const typeCounts = new Map()

  return items.map((area) => {
    const sequence = (typeCounts.get(area.area_type) ?? 0) + 1
    typeCounts.set(area.area_type, sequence)

    return {
      ...area,
      displayName: `${AREA_TYPE_LABELS[area.area_type] ?? area.area_type} ${sequence}`,
    }
  })
}

export default function CommonAreasSection({
  items = [],
  error = '',
  canManage = false,
  hideTitleOnMobile = false,
  onCreate,
  isCreating = false,
}) {
  const [form, setForm] = useState(initialForm)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('asc')
  const numberedAreas = useMemo(() => getNumberedAreas(items), [items])
  const visibleAreas = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase('pt-BR')

    return numberedAreas
      .filter((area) => (
        `${area.displayName} ${area.area_type}`.toLocaleLowerCase('pt-BR').includes(query)
      ))
      .sort((firstArea, secondArea) => {
        const comparison = firstArea.displayName.localeCompare(secondArea.displayName, 'pt-BR', {
          sensitivity: 'base',
          numeric: true,
        })

        return sortOrder === 'asc' ? comparison : -comparison
      })
  }, [numberedAreas, searchTerm, sortOrder])

  const toggleWeekday = (weekday) => {
    setForm((current) => ({
      ...current,
      availableWeekdays: current.availableWeekdays.includes(weekday)
        ? current.availableWeekdays.filter((day) => day !== weekday)
        : [...current.availableWeekdays, weekday].sort((first, second) => first - second),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (form.availableWeekdays.length === 0) {
      toast.error('Selecione pelo menos um dia da semana.')
      return
    }

    if (!isHalfHourTime(form.startHour) || !isHalfHourTime(form.endHour)) {
      toast.error('Selecione horários em intervalos de 30 minutos.')
      return
    }

    if (form.startHour && form.endHour && form.startHour >= form.endHour) {
      toast.error('O horário final precisa ser posterior ao horário inicial.')
      return
    }

    try {
      await onCreate(form)
      setForm(initialForm)
      toast.success('Área comum cadastrada.')
    } catch (createError) {
      toast.error(createError.message ?? 'Não foi possível cadastrar a área comum.')
    }
  }

  return (
    <div className={styles.pageContent}>
      <header className={styles.pageHeading}>
        <div>
          <h1 className={hideTitleOnMobile ? styles.hideTitleOnMobile : undefined}>Áreas comuns</h1>
        </div>
      </header>

      {canManage && (
        <form className={styles.createForm} onSubmit={handleSubmit}>
          <h2>Cadastrar área comum</h2>

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Tipo de área</span>
              <Select
                value={form.areaType}
                onChange={(areaType) => setForm({ ...form, areaType })}
                options={Object.entries(AREA_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </label>

            <fieldset className={styles.weekdayField}>
              <legend>Dias disponíveis</legend>
              <div className={styles.weekdayOptions}>
                {weekdayOptions.map(({ value, label }) => (
                  <label key={value} className={styles.weekdayOption}>
                    <input
                      type="checkbox"
                      checked={form.availableWeekdays.includes(value)}
                      onChange={() => toggleWeekday(value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className={styles.field}>
              <span>Horário inicial <small>(opcional)</small></span>
              <input
                type="time"
                step="1800"
                value={form.startHour}
                onChange={(event) => setForm({ ...form, startHour: event.target.value })}
              />
            </label>

            <label className={styles.field}>
              <span>Horário final <small>(opcional)</small></span>
              <input
                type="time"
                step="1800"
                value={form.endHour}
                onChange={(event) => setForm({ ...form, endHour: event.target.value })}
              />
            </label>
          </div>

          <button type="submit" className={styles.primaryButton} disabled={isCreating}>
            <Plus size={16} weight="bold" aria-hidden="true" />
            {isCreating ? 'Cadastrando...' : 'Cadastrar área'}
          </button>
        </form>
      )}

      {error ? (
        <div className={styles.errorState} role="alert">{error}</div>
      ) : numberedAreas.length === 0 ? (
        <div className={styles.emptyState}>
          Nenhuma área visível. Confirme se há áreas cadastradas e se a policy RLS permite a leitura para esta organização.
        </div>
      ) : (
        <section className={styles.listCard} aria-label="Áreas comuns cadastradas">
          <div className={styles.listControls}>
            <label className={styles.searchField}>
              <span className={styles.visuallyHidden}>Buscar áreas comuns</span>
              <span className={styles.searchIcon} aria-hidden="true">
                <MagnifyingGlass size={17} weight="bold" />
              </span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nome ou tipo..."
              />
            </label>
            <Select
              value={sortOrder}
              onChange={setSortOrder}
              ariaLabel="Ordenar áreas por nome"
              options={SORT_OPTIONS}
            />
          </div>
          <div className={styles.listGrid} tabIndex={0} aria-label="Lista de áreas comuns">
            {visibleAreas.map((area) => (
              <div key={area.id} className={styles.listItem}>
                <strong className={styles.areaName}>{area.displayName}</strong>
                <div className={styles.areaDetails}>
                  <span className={styles.areaDetail}>
                    <span className={styles.detailLabel}>
                      <Clock size={16} weight="regular" aria-hidden="true" />
                      Horário
                    </span>
                    <span>
                      {area.start_hour && area.end_hour
                        ? `${formatHour(area.start_hour)} às ${formatHour(area.end_hour)}`
                        : 'Não definido'}
                    </span>
                  </span>
                  <span className={`${styles.areaDetail} ${styles.weekdays}`}>
                    <span className={styles.detailLabel}>
                      <CalendarBlank size={16} weight="regular" aria-hidden="true" />
                      Dias disponíveis
                    </span>
                    {area.available_weekdays?.length
                      ? <AvailableWeekdays days={area.available_weekdays} />
                      : <span>Não definidos</span>}
                  </span>
                </div>
              </div>
            ))}
            {visibleAreas.length === 0 && (
              <p className={styles.noResults}>Nenhuma área corresponde à pesquisa.</p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
