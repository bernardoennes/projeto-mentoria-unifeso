import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, X } from '@phosphor-icons/react'
import BrickLoader from '../BrickLoader/BrickLoader.jsx'
import Select from '../Select/Select.jsx'
import styles from './NewReservationDrawer.module.css'

export default function NewReservationDrawer({
  open,
  onClose,
  editingReservation,
  areasError,
  isLoadingAreas,
  areas,
  selectedDate,
  onDateChange,
  disableAreaAndDate,
  todayKey,
  selectedStart,
  onStartChange,
  startOptions,
  selectedEnd,
  onEndChange,
  endOptions,
  selectedAreaId,
  onAreaChange,
  numberOfPeople,
  onNumberOfPeopleChange,
  observations,
  onObservationsChange,
  isEvent,
  onEventChange,
  canCreateEvent,
  isSelectedDayOpen,
  isSelectedTimeOpen,
  hasTimeConflict,
  hasResidentTimeConflict,
  onSubmit,
}) {
  useEffect(() => {
    if (!open) {
      return undefined
    }

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <>
      <button
        type="button"
        className={styles.overlay}
        aria-label="Fechar formulário de nova reserva"
        onClick={onClose}
      />
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="drawerTitle">
        <header className={styles.drawerHeader}>
          <div>
            <h2 id="drawerTitle">{editingReservation ? 'Editar reserva' : 'Nova reserva'}</h2>
            <p>{editingReservation
              ? 'Atualize o horário e as informações da reserva.'
              : 'Preencha os dados para reservar uma área.'}
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Fechar formulário"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>

        {areasError ? (
          <div className={styles.stateMessage} role="alert">{areasError}</div>
        ) : isLoadingAreas ? (
          <div className={styles.loadingState}><BrickLoader size="sm" /></div>
        ) : areas.length === 0 ? (
          <div className={styles.stateMessage}>
            Nenhuma área comum cadastrada para este condomínio.
            <Link to="/settings?section=areas">Ver áreas comuns</Link>
          </div>
        ) : (
          <form className={styles.form} onSubmit={onSubmit}>
            <label className={styles.field}>
              <span>Dia</span>
              <input
                type="date"
                value={selectedDate}
                min={todayKey}
                onChange={(event) => onDateChange(event.target.value)}
                disabled={disableAreaAndDate}
                required
              />
            </label>

            <div className={styles.timeFields}>
              <label className={styles.field}>
                <span>Início</span>
                <Select
                  value={selectedStart}
                  onChange={onStartChange}
                  options={startOptions}
                />
              </label>
              <label className={styles.field}>
                <span>Fim</span>
                <Select
                  value={selectedEnd}
                  onChange={onEndChange}
                  options={endOptions}
                />
              </label>
            </div>

            <label className={styles.field}>
              <span>Área</span>
              <Select
                value={selectedAreaId}
                onChange={onAreaChange}
                disabled={disableAreaAndDate}
                options={areas.map((area) => ({ value: String(area.id), label: area.displayName }))}
              />
            </label>

            <label className={styles.field}>
              <span>Número de pessoas</span>
              <input
                type="number"
                min="1"
                step="1"
                value={numberOfPeople}
                onChange={(event) => onNumberOfPeopleChange(event.target.value)}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Observações <small>(opcional)</small></span>
              <textarea
                value={observations}
                onChange={(event) => onObservationsChange(event.target.value)}
                rows={4}
                placeholder="Inclua informações adicionais sobre a utilização do espaço."
              />
            </label>

            {canCreateEvent && (
              <label className={styles.eventOption}>
                <input
                  type="checkbox"
                  checked={isEvent}
                  onChange={(event) => onEventChange(event.target.checked)}
                />
                <span>Evento (prioridade na agenda)</span>
              </label>
            )}

            <p className={isSelectedDayOpen && isSelectedTimeOpen && !hasTimeConflict && !hasResidentTimeConflict
              ? styles.availableMessage
              : styles.unavailableMessage}
            >
              {!isSelectedDayOpen
                ? 'Área indisponível neste dia da semana.'
                : !isSelectedTimeOpen
                  ? 'Escolha um horário dentro do funcionamento da área.'
                  : hasResidentTimeConflict
                    ? 'Você já possui uma reserva em um horário que se sobrepõe neste dia.'
                    : hasTimeConflict
                    ? 'Já existe uma reserva nesse horário para a área selecionada.'
                    : 'Área disponível no horário escolhido.'}
            </p>

            <p className={styles.localNotice}>
              As reservas ficam salvas neste navegador, sem sincronização com o servidor.
            </p>
            <button
              className={styles.submitButton}
              type="submit"
              disabled={!isSelectedDayOpen
                || !isSelectedTimeOpen
                || Boolean(hasTimeConflict)
                || hasResidentTimeConflict}
            >
              <Plus size={17} weight="bold" />
              {editingReservation ? 'Salvar alterações' : 'Criar reserva'}
            </button>
          </form>
        )}
      </aside>
    </>
  )
}
