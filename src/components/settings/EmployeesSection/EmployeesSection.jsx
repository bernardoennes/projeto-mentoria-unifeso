import { useState } from 'react'
import { MagnifyingGlass, PencilSimple, Plus, Trash } from '@phosphor-icons/react'
import { toast } from 'react-toastify'
import CpfInput from '../../auth/CpfInput/CpfInput.jsx'
import EditMemberModal from '../EditMemberModal/EditMemberModal.jsx'
import RemoveResidentModal from '../RemoveResidentModal/RemoveResidentModal.jsx'
import { isValidCpf, normalizeCpf } from '../../../utils/cpfValidation.js'
import { getEmployeeRoleLabel, getEmployeeRoleOptions } from '../../../utils/employeeRoles.js'
import Select, { SORT_OPTIONS } from '../../Select/Select'
import styles from '../ResidentsSection/ResidentsSection.module.css'
import employeeStyles from './EmployeesSection.module.css'

const initialForm = { name: '', cpf: '', cargoCode: '' }

function getInitials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('pt-BR')
}

export default function EmployeesSection({
  items = [],
  error = '',
  canManage = false,
  hideTitleOnMobile = false,
  onCreate,
  isCreating = false,
  onRemove,
  isRemoving = false,
  onUpdate,
  isUpdating = false,
}) {
  const [form, setForm] = useState(initialForm)
  const [employeeToEdit, setEmployeeToEdit] = useState(null)
  const [editCargoCode, setEditCargoCode] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('asc')
  const [employeeToRemove, setEmployeeToRemove] = useState(null)

  const visibleEmployees = items
    .filter((employee) => {
      const searchableText = [employee.name, employee.cpfMasked, employee.cargoCode, getEmployeeRoleLabel(employee.cargoCode)]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('pt-BR')

      return searchableText.includes(searchTerm.trim().toLocaleLowerCase('pt-BR'))
    })
    .sort((first, second) => {
      const comparison = first.name.localeCompare(second.name, 'pt-BR', { sensitivity: 'base' })

      return sortOrder === 'asc' ? comparison : -comparison
    })

  const handleSubmit = async (event) => {
    event.preventDefault()

    const cpf = normalizeCpf(form.cpf)

    if (!isValidCpf(cpf)) {
      toast.error('Informe um CPF válido.')
      return
    }

    try {
      await onCreate({ name: form.name.trim(), cpf, cargoCode: form.cargoCode })
      setForm(initialForm)
      toast.success('Funcionário cadastrado. A senha provisória não é exibida.')
    } catch (createError) {
      toast.error(createError.message)
    }
  }

  const openEdit = (employee) => {
    setEmployeeToEdit(employee)
    setEditCargoCode(employee.cargoCode ?? '')
  }

  const handleEditSubmit = async (event) => {
    event.preventDefault()

    try {
      await onUpdate({ membershipId: employeeToEdit.id, cargoCode: editCargoCode })
      toast.success('Funcionário atualizado.')
      setEmployeeToEdit(null)
    } catch (updateError) {
      toast.error(updateError.message)
    }
  }

  const handleRemove = async () => {
    if (!employeeToRemove?.userId) {
      toast.error('Não foi possível identificar o perfil deste funcionário.')
      return
    }

    try {
      await onRemove(employeeToRemove.userId)
      toast.success('Vínculo do funcionário removido. A conta e o perfil foram mantidos.')
      setEmployeeToRemove(null)
    } catch (removeError) {
      toast.error(removeError.message)
    }
  }

  return (
    <div className={styles.pageContent}>
      <header className={styles.pageHeading}>
        <div>
          <h1 className={hideTitleOnMobile ? styles.hideTitleOnMobile : undefined}>Funcionários</h1>
        </div>
      </header>

      {canManage && (
        <form className={styles.createForm} onSubmit={handleSubmit}>
          <h2>Cadastrar funcionário</h2>
          <div className={styles.formGrid}>
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Nome completo"
              aria-label="Nome completo"
            />
            <CpfInput
              id="employee-cpf"
              label="CPF"
              name="cpf"
              value={form.cpf}
              onChange={(event) => setForm({ ...form, cpf: event.target.value })}
              variant="settings"
            />
            <Select
              value={form.cargoCode}
              onChange={(cargoCode) => setForm({ ...form, cargoCode })}
              ariaLabel="Cargo"
              placeholder="Selecione o cargo"
              options={getEmployeeRoleOptions().map((role) => ({ value: role.value, label: role.label }))}
            />
          </div>
          <button type="submit" className={styles.primaryButton} disabled={isCreating}>
            <Plus size={16} weight="bold" aria-hidden="true" />
            {isCreating ? 'Cadastrando...' : 'Cadastrar funcionário'}
          </button>
        </form>
      )}

      {error ? (
        <div className={styles.errorState} role="alert">{error}</div>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>Nenhum funcionário cadastrado.</div>
      ) : (
        <section className={styles.listCard} aria-labelledby="employees-list-title">
          <div className={styles.listHeading}>
            <h2 id="employees-list-title">Funcionários cadastrados</h2>
          </div>
          <div className={styles.listControls}>
            <label className={styles.searchField}>
              <span className={styles.visuallyHidden}>Pesquisar funcionários</span>
              <span className={styles.searchIcon} aria-hidden="true">
                <MagnifyingGlass size={17} weight="bold" />
              </span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Pesquisar por nome, CPF ou cargo"
              />
            </label>
            <Select
              value={sortOrder}
              onChange={setSortOrder}
              ariaLabel="Ordenar funcionários por nome"
              options={SORT_OPTIONS}
            />
          </div>

          {visibleEmployees.length === 0 ? (
            <div className={styles.emptyState}>Nenhum funcionário corresponde à pesquisa.</div>
          ) : (
            <>
              <div
                className={`${styles.tableHeader} ${employeeStyles.employeeTableHeader}`}
                aria-hidden="true"
              >
                <span>Funcionário</span>
                <span>Cargo</span>
                <span>Ações</span>
              </div>
              <div className={styles.listGrid} tabIndex={0} aria-label="Lista de funcionários">
                {visibleEmployees.map((employee) => (
                  <div key={employee.id ?? employee.name} className={styles.listItem}>
                    <div className={styles.residentIdentity}>
                      <span className={styles.avatar} aria-hidden="true">
                        {getInitials(employee.name)}
                      </span>
                      <div>
                        <strong>{employee.name}</strong>
                        {employee.cpfMasked && <small className={styles.maskedCpf}>CPF {employee.cpfMasked}</small>}
                      </div>
                    </div>
                    <span
                      className={`${styles.unit} ${employeeStyles.employeeCargo}`}
                      data-label="Cargo"
                    >
                      {getEmployeeRoleLabel(employee.cargoCode)}
                    </span>
                    <div className={styles.rowActions}>
                      {canManage && (
                        <button
                          type="button"
                          className={styles.editButton}
                          onClick={() => openEdit(employee)}
                          title="Editar funcionário"
                          aria-label={`Editar ${employee.name}`}
                        >
                          <PencilSimple size={18} aria-hidden="true" />
                        </button>
                      )}
                      {canManage && (
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => setEmployeeToRemove(employee)}
                          disabled={!employee.userId}
                          title="Remover funcionário"
                          aria-label={`Remover ${employee.name}`}
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

      {employeeToEdit && (
        <EditMemberModal
          title="Editar funcionário"
          name={employeeToEdit.name}
          isSaving={isUpdating}
          onCancel={() => setEmployeeToEdit(null)}
          onSubmit={handleEditSubmit}
        >
          <Select
            value={editCargoCode}
            onChange={setEditCargoCode}
            ariaLabel="Cargo"
            placeholder="Sem cargo"
            options={getEmployeeRoleOptions(employeeToEdit.cargoCode).map((role) => ({ value: role.value, label: role.label }))}
          />
        </EditMemberModal>
      )}

      <RemoveResidentModal
        resident={employeeToRemove}
        title="Remover funcionário?"
        isRemoving={isRemoving}
        onCancel={() => {
          if (!isRemoving) {
            setEmployeeToRemove(null)
          }
        }}
        onConfirm={handleRemove}
      />
    </div>
  )
}
