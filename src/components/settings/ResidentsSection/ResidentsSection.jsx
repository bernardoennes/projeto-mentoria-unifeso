import { useState } from 'react'
import { Plus, Trash } from '@phosphor-icons/react'
import { toast } from 'react-toastify'
import CpfInput from '../../auth/CpfInput/CpfInput.jsx'
import RemoveResidentModal from '../RemoveResidentModal/RemoveResidentModal.jsx'
import { isValidCpf, normalizeCpf } from '../../../utils/cpfValidation.js'
import styles from './ResidentsSection.module.css'

const initialForm = { name: '', cpf: '', block: '', unitNumber: '' }

function getInitials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('pt-BR')
}

export default function ResidentsSection({
  items = [],
  error = '',
  canManage = false,
  hideTitleOnMobile = false,
  onCreate,
  isCreating = false,
  onRemove,
  isRemoving = false,
}) {
  const [form, setForm] = useState(initialForm)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('asc')
  const [residentToRemove, setResidentToRemove] = useState(null)

  const visibleResidents = items
    .filter((resident) => {
      const searchableText = [resident.name, resident.cpfMasked, resident.block, resident.unit_number]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('pt-BR')

      return searchableText.includes(searchTerm.trim().toLocaleLowerCase('pt-BR'))
    })
    .sort((firstResident, secondResident) => {
      const comparison = firstResident.name.localeCompare(secondResident.name, 'pt-BR', {
        sensitivity: 'base',
      })

      return sortOrder === 'asc' ? comparison : -comparison
    })

  const handleSubmit = async (event) => {
    event.preventDefault()

    const cpf = normalizeCpf(form.cpf)
    const unitNumber = Number(form.unitNumber)

    if (!isValidCpf(cpf)) {
      toast.error('Informe um CPF válido.')
      return
    }

    if (!Number.isSafeInteger(unitNumber) || unitNumber < 1) {
      toast.error('Informe um número de unidade válido.')
      return
    }

    try {
      await onCreate({ ...form, cpf, unitNumber })
      setForm(initialForm)
      setIsFormOpen(false)
      toast.success('Condômino cadastrado. A senha provisória não é exibida.')
    } catch (createError) {
      toast.error(createError.message)
    }
  }

  const handleRemove = async () => {
    if (!residentToRemove?.userId) {
      toast.error('Não foi possível identificar o perfil deste condômino.')
      return
    }

    try {
      await onRemove(residentToRemove.userId)
      toast.success('Vínculo do condômino removido. A conta e o perfil foram mantidos.')
      setResidentToRemove(null)
    } catch (removeError) {
      toast.error(removeError.message)
    }
  }

  return (
    <div className={styles.pageContent}>
      <header className={styles.pageHeading}>
        <div>
          <h1 className={hideTitleOnMobile ? styles.hideTitleOnMobile : undefined}>Moradores</h1>
        </div>
        {canManage && (
          <button
            type="button"
            className={styles.addButton}
            aria-expanded={isFormOpen}
            onClick={() => setIsFormOpen((current) => !current)}
          >
            <Plus size={16} weight="bold" aria-hidden="true" />
            {isFormOpen ? 'Fechar cadastro' : 'Novo morador'}
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
              <h2>Cadastrar morador</h2>
              <div className={styles.formGrid}>
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Nome completo"
              aria-label="Nome completo"
            />
            <CpfInput
              id="resident-cpf"
              label="CPF"
              name="cpf"
              value={form.cpf}
              onChange={(event) => setForm({ ...form, cpf: event.target.value })}
              variant="settings"
            />
            <input
              required
              value={form.block}
              onChange={(event) => setForm({ ...form, block: event.target.value })}
              placeholder="Bloco"
              aria-label="Bloco"
            />
            <input
              required
              type="number"
              min="1"
              step="1"
              value={form.unitNumber}
              onChange={(event) => setForm({ ...form, unitNumber: event.target.value })}
              placeholder="Unidade"
              aria-label="Unidade"
            />
              </div>
              <button type="submit" className={styles.primaryButton} disabled={isCreating}>
                {isCreating ? 'Cadastrando...' : 'Cadastrar condômino'}
              </button>
            </form>
          </div>
        </div>
      )}

      {error ? (
        <div className={styles.errorState} role="alert">{error}</div>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>
          Nenhum condômino visível. Confirme se há moradores cadastrados e se a policy RLS permite a leitura nesta organização.
        </div>
      ) : (
        <section className={styles.listCard} aria-labelledby="residents-list-title">
          <div className={styles.listHeading}>
            <h2 id="residents-list-title">Moradores cadastrados</h2>
          </div>
          <div className={styles.listControls}>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Pesquisar por nome, CPF, bloco ou unidade"
              aria-label="Pesquisar condôminos"
            />
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              aria-label="Ordenar condôminos por nome"
            >
              <option value="asc">Nome: A a Z</option>
              <option value="desc">Nome: Z a A</option>
            </select>
          </div>

          {visibleResidents.length === 0 ? (
            <div className={styles.emptyState}>Nenhum morador corresponde à pesquisa.</div>
          ) : (
            <>
              <div className={styles.tableHeader} aria-hidden="true">
                <span>Morador</span>
                <span>Unidade</span>
                <span>Perfil</span>
                <span>Ações</span>
              </div>
              <div className={styles.listGrid}>
                {visibleResidents.map((resident) => (
                  <div key={resident.id ?? resident.name} className={styles.listItem}>
                    <div className={styles.residentIdentity}>
                      <span className={styles.avatar} aria-hidden="true">
                        {getInitials(resident.name)}
                      </span>
                      <div>
                        <strong>{resident.name}</strong>
                        {resident.cpfMasked && <small className={styles.maskedCpf}>CPF {resident.cpfMasked}</small>}
                      </div>
                    </div>
                    <span className={styles.unit}>
                      {[resident.block, resident.unit_number].filter(Boolean).join(' · ') || 'Não informada'}
                    </span>
                    <span className={styles.badge}>{resident.role ?? 'Morador'}</span>
                    <div className={styles.rowActions}>
                      {canManage && (
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => setResidentToRemove(resident)}
                          disabled={!resident.userId}
                          title="Remover condômino"
                          aria-label={`Remover ${resident.name}`}
                        >
                          <Trash size={18} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <RemoveResidentModal
        resident={residentToRemove}
        isRemoving={isRemoving}
        onCancel={() => {
          if (!isRemoving) {
            setResidentToRemove(null)
          }
        }}
        onConfirm={handleRemove}
      />
    </div>
  )
}
