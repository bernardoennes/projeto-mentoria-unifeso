import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { createCommonArea as createCommonAreaRequest, fetchCommonAreas } from '../../../services/commonAreaService.js'
import { fetchResidents, provisionCondomino, removeCondomino, updateResidentDetails } from '../../../services/residentService.js'
import { fetchEmployees, provisionFuncionario, removeFuncionario, updateEmployeeDetails } from '../../../services/employeeService.js'
import { buildUserProfile } from '../../../services/userService.js'
import { canManageCondominium } from '../../../utils/permissions.js'

function getQueryErrorMessage(error) {
  if (error?.code === '42501' || error?.status === 403) {
    return 'Não foi possível carregar os dados. Verifique suas permissões e tente novamente.'
  }

  return 'Não foi possível carregar os dados. Tente novamente.'
}

export function useSettingsPageState({ user, membership }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [commonAreas, setCommonAreas] = useState([])
  const [residents, setResidents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [areasError, setAreasError] = useState('')
  const [isCreatingArea, setIsCreatingArea] = useState(false)
  const [residentsError, setResidentsError] = useState('')
  const [isCreatingResident, setIsCreatingResident] = useState(false)
  const [isRemovingResident, setIsRemovingResident] = useState(false)
  const [employees, setEmployees] = useState([])
  const [employeesError, setEmployeesError] = useState('')
  const [isCreatingEmployee, setIsCreatingEmployee] = useState(false)
  const [isRemovingEmployee, setIsRemovingEmployee] = useState(false)
  const [isUpdatingResident, setIsUpdatingResident] = useState(false)
  const [isUpdatingEmployee, setIsUpdatingEmployee] = useState(false)

  const canManage = canManageCondominium(membership)
  const requestedSection = searchParams.get('section')
  const isRestrictedSection = ['areas', 'residents', 'employees'].includes(requestedSection) && !canManage
  const activeSection = isRestrictedSection ? 'account' : requestedSection ?? 'account'
  const profile = buildUserProfile(user, membership)

  useEffect(() => {
    if (isRestrictedSection) {
      setSearchParams({ section: 'account' }, { replace: true })
    }
  }, [isRestrictedSection, setSearchParams])

  useEffect(() => {
    const organisationId = membership?.organisation_id

    let isCurrent = true

    async function loadSettingsData() {
      setIsLoading(true)
      setAreasError('')
      setResidentsError('')
      setEmployeesError('')

      const [areasResult, residentsResult, employeesResult] = await Promise.allSettled([
        fetchCommonAreas(organisationId),
        fetchResidents(organisationId),
        fetchEmployees(organisationId),
      ])

      if (!isCurrent) {
        return
      }

      setCommonAreas(areasResult.status === 'fulfilled' ? areasResult.value : [])
      setResidents(residentsResult.status === 'fulfilled' ? residentsResult.value : [])
      setAreasError(areasResult.status === 'rejected' ? getQueryErrorMessage(areasResult.reason) : '')
      setResidentsError(residentsResult.status === 'rejected' ? getQueryErrorMessage(residentsResult.reason) : '')
      setEmployees(employeesResult.status === 'fulfilled' ? employeesResult.value : [])
      setEmployeesError(employeesResult.status === 'rejected' ? getQueryErrorMessage(employeesResult.reason) : '')
      setIsLoading(false)
    }

    if (organisationId && canManage) {
      loadSettingsData()
    }

    return () => {
      isCurrent = false
    }
  }, [canManage, membership?.organisation_id])

  const setActiveSection = (sectionId) => setSearchParams({ section: sectionId })

  const createResident = async ({ name, cpf, block, unitNumber }) => {
    if (!canManage) {
      throw new Error('Apenas síndicos podem cadastrar condôminos.')
    }

    if (!membership?.organisation_id) {
      throw new Error('Não foi possível identificar a organização do usuário.')
    }

    setIsCreatingResident(true)

    try {
      const result = await provisionCondomino({
        name,
        cpf,
        organisationId: membership.organisation_id,
        block,
        unitNumber,
      })
      const updatedResidents = await fetchResidents(membership.organisation_id)
      setResidents(updatedResidents)
      setResidentsError('')
      return result
    } catch (error) {
      const message = error?.code === '42501'
        ? getQueryErrorMessage(error)
        : error?.message ?? 'Não foi possível cadastrar o condômino.'
      throw new Error(message)
    } finally {
      setIsCreatingResident(false)
    }
  }

  const createEmployee = async ({ name, cpf, cargoCode }) => {
    if (!canManage) {
      throw new Error('Apenas síndicos podem cadastrar funcionários.')
    }

    if (!membership?.organisation_id) {
      throw new Error('Não foi possível identificar a organização do usuário.')
    }

    setIsCreatingEmployee(true)

    try {
      const result = await provisionFuncionario({
        name,
        cpf,
        organisationId: membership.organisation_id,
        cargoCode,
      })
      setEmployees(await fetchEmployees(membership.organisation_id))
      setEmployeesError('')
      return result
    } catch (error) {
      const message = error?.code === '42501'
        ? getQueryErrorMessage(error)
        : error?.message ?? 'Não foi possível cadastrar o funcionário.'
      throw new Error(message)
    } finally {
      setIsCreatingEmployee(false)
    }
  }

  const deleteEmployee = async (userId) => {
    if (!canManage) {
      throw new Error('Apenas síndicos podem remover funcionários.')
    }

    if (!membership?.organisation_id || !Number.isSafeInteger(Number(userId))) {
      throw new Error('Não foi possível identificar o condomínio ou o perfil do funcionário.')
    }

    setIsRemovingEmployee(true)

    try {
      const result = await removeFuncionario({
        organisationId: membership.organisation_id,
        userId: Number(userId),
      })
      setEmployees(await fetchEmployees(membership.organisation_id))
      setEmployeesError('')
      return result
    } catch (error) {
      throw new Error(error?.message ?? 'Não foi possível remover o vínculo do funcionário.')
    } finally {
      setIsRemovingEmployee(false)
    }
  }

  const createArea = async ({ areaType, availableWeekdays, startHour, endHour }) => {
    if (!canManage) {
      throw new Error('Apenas síndicos podem cadastrar áreas comuns.')
    }

    if (!membership?.organisation_id) {
      throw new Error('Não foi possível identificar a organização do usuário.')
    }

    setIsCreatingArea(true)

    try {
      const result = await createCommonAreaRequest({
        organisationId: membership.organisation_id,
        areaType,
        availableWeekdays,
        startHour,
        endHour,
      })

      try {
        const updatedAreas = await fetchCommonAreas(membership.organisation_id)
        setCommonAreas(updatedAreas)
        setAreasError('')
      } catch (refreshError) {
        setAreasError(
          `Área cadastrada, mas não foi possível atualizar a lista: ${getQueryErrorMessage(refreshError)}`,
        )
      }

      return result
    } finally {
      setIsCreatingArea(false)
    }
  }

  const deleteResident = async (userId) => {
    if (!canManage) {
      throw new Error('Apenas síndicos podem remover condôminos.')
    }

    if (!membership?.organisation_id || !Number.isSafeInteger(Number(userId))) {
      throw new Error('Não foi possível identificar o condomínio ou o perfil do condômino.')
    }

    setIsRemovingResident(true)

    try {
      const result = await removeCondomino({
        organisationId: membership.organisation_id,
        userId: Number(userId),
      })
      const updatedResidents = await fetchResidents(membership.organisation_id)
      setResidents(updatedResidents)
      setResidentsError('')
      return result
    } catch (error) {
      throw new Error(error?.message ?? 'Não foi possível remover o vínculo do condômino.')
    } finally {
      setIsRemovingResident(false)
    }
  }

  const updateResident = async ({ membershipId, block, unitNumber }) => {
    if (!canManage) {
      throw new Error('Apenas síndicos podem editar condôminos.')
    }

    setIsUpdatingResident(true)

    try {
      await updateResidentDetails({ membershipId, block, unitNumber })
      setResidents(await fetchResidents(membership.organisation_id))
      setResidentsError('')
    } finally {
      setIsUpdatingResident(false)
    }
  }

  const updateEmployee = async ({ membershipId, cargoCode }) => {
    if (!canManage) {
      throw new Error('Apenas síndicos podem editar funcionários.')
    }

    setIsUpdatingEmployee(true)

    try {
      await updateEmployeeDetails({ membershipId, cargoCode })
      setEmployees(await fetchEmployees(membership.organisation_id))
      setEmployeesError('')
    } finally {
      setIsUpdatingEmployee(false)
    }
  }

  return {
    updateResident,
    isUpdatingResident,
    updateEmployee,
    isUpdatingEmployee,
    activeSection,
    setActiveSection,
    profile,
    canManage,
    commonAreas: membership?.organisation_id && canManage ? commonAreas : [],
    residents: membership?.organisation_id && canManage ? residents : [],
    employees: membership?.organisation_id && canManage ? employees : [],
    employeesError,
    createEmployee,
    isCreatingEmployee,
    deleteEmployee,
    isRemovingEmployee,
    isLoading: Boolean(membership?.organisation_id && canManage) && isLoading,
    areasError,
    createArea,
    isCreatingArea,
    residentsError,
    createResident,
    isCreatingResident,
    deleteResident,
    isRemovingResident,
  }
}
