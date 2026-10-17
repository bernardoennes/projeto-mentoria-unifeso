import { useMemo, useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import { toast } from 'react-toastify'
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
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const numberedAreas = useMemo(() => getNumberedAreas(items), [items])
  const visibleAreas = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase('pt-BR')

    if (!query) {
      return numberedAreas
    }

    return numberedAreas.filter((area) => (
      `${area.displayName} ${area.area_type}`.toLocaleLowerCase('pt-BR').includes(query)
    ))
  }, [numberedAreas, searchTerm])

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

    if (form.startHour && form.endHour && form.startHour >= form.endHour) {
      toast.error('O horário final precisa ser posterior ao horário inicial.')
      return
    }

    try {
      await onCreate(form)
      setForm(initialForm)
      setIsFormOpen(false)
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
        {canManage && (
          <button
            type="button"
            className={styles.addButton}
            aria-expanded={isFormOpen}
            onClick={() => setIsFormOpen((current) => !current)}
          >
            <Plus size={16} weight="bold" aria-hidden="true" />
            {isFormOpen ? 'Fechar cadastro' : 'Nova área comum'}
          </button>
        )}
      </header>

      {canManage && (
        <div
          className={`${styles.formReveal} ${isFormOpen ? styles.formRevealOpen : ''}`}
          aria-hidden={!isFormOpen}
          inert={!isFormOpen}
        >
          <div className={styles.formRevealInner}>
            <form className={styles.createForm} onSubmit={handleSubmit}>
              <h2>Cadastrar área comum</h2>

              <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Tipo de área</span>
              <select
                value={form.areaType}
                onChange={(event) => setForm({ ...form, areaType: event.target.value })}
              >
                {Object.entries(AREA_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
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
                value={form.startHour}
                onChange={(event) => setForm({ ...form, startHour: event.target.value })}
              />
            </label>

            <label className={styles.field}>
              <span>Horário final <small>(opcional)</small></span>
              <input
                type="time"
                value={form.endHour}
                onChange={(event) => setForm({ ...form, endHour: event.target.value })}
              />
            </label>
              </div>

              <button type="submit" className={styles.primaryButton} disabled={isCreating}>
                {isCreating ? 'Cadastrando...' : 'Cadastrar área'}
              </button>
            </form>
          </div>
        </div>
      )}

      {error ? (
        <div className={styles.errorState} role="alert">{error}</div>
      ) : numberedAreas.length === 0 ? (
        <div className={styles.emptyState}>
          Nenhuma área visível. Confirme se há áreas cadastradas e se a policy RLS permite a leitura para esta organização.
        </div>
      ) : (
        <section className={styles.listCard} aria-labelledby="common-areas-list-title">
          <div className={styles.listHeading}>
            <h2 id="common-areas-list-title">Áreas cadastradas</h2>
          </div>
          <label className={styles.searchField}>
            <span className={styles.visuallyHidden}>Buscar áreas comuns</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nome ou tipo..."
            />
          </label>
          <div className={styles.tableHeader} aria-hidden="true">
            <span>Área</span>
            <span>Horário</span>
            <span>Dias disponíveis</span>
          </div>
          <div className={styles.listGrid}>
            {visibleAreas.map((area) => (
              <div key={area.id} className={styles.listItem}>
                <strong>{area.displayName}</strong>
                <span>
                  {area.start_hour && area.end_hour
                    ? `${area.start_hour} às ${area.end_hour}`
                    : 'Não definido'}
                </span>
                <span className={styles.weekdays}>
                  {area.available_weekdays?.map((day) => weekdayLabels[day] ?? day).join(', ')
                    || 'Não definidos'}
                </span>
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
