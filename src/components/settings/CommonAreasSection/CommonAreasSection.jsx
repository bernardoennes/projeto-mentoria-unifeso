import styles from './CommonAreasSection.module.css'
import { AREA_TYPE_LABELS } from '../../../services/commonAreaService.js'

export default function CommonAreasSection({ items = [], error = '' }) {
  return (
    <section className={styles.panel}>
      <h2>Áreas comuns</h2>

      {error ? (
        <div className={styles.errorState} role="alert">{error}</div>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>
          Nenhuma área visível. Confirme se há áreas cadastradas e se a policy RLS permite a leitura para esta organização.
        </div>
      ) : (
        <div className={styles.listGrid}>
          {items.map((area) => (
            <div key={area.id ?? area.name} className={styles.listItem}>
              <div>
                <strong>{AREA_TYPE_LABELS[area.area_type] ?? area.area_type}</strong>
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
