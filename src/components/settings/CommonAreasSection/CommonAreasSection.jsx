import { useState } from 'react'
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
  onCreate,
  isCreating = false,
}) {
  const [form, setForm] = useState(initialForm)
  const numberedAreas = getNumberedAreas(items)

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
      toast.success('Área comum cadastrada.')
    } catch (createError) {
      toast.error(createError.message ?? 'Não foi possível cadastrar a área comum.')
    }
  }

  return (
    <section className={styles.panel}>
      <h2>Áreas comuns</h2>

      {canManage && (
        <form className={styles.createForm} onSubmit={handleSubmit}>
          <h3>Cadastrar área comum</h3>

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
      )}

      {error ? (
        <div className={styles.errorState} role="alert">{error}</div>
      ) : numberedAreas.length === 0 ? (
        <div className={styles.emptyState}>
          Nenhuma área visível. Confirme se há áreas cadastradas e se a policy RLS permite a leitura para esta organização.
        </div>
      ) : (
        <div className={styles.listGrid}>
          {numberedAreas.map((area) => (
            <div key={area.id} className={styles.listItem}>
              <div>
                <strong>{area.displayName}</strong>
                <small>
                  {area.start_hour && area.end_hour
                    ? `${area.start_hour} às ${area.end_hour}`
                    : 'Horário não definido'}
                </small>
              </div>
              <span className={styles.weekdays}>
                {area.available_weekdays?.join(', ') ?? 'Dias não definidos'}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
