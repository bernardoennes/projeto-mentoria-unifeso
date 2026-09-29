import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchCommonAreas } from '../../../services/commonAreaService.js'
import { fetchResidents, provisionCondomino, removeCondomino } from '../../../services/residentService.js'
import { buildUserProfile } from '../../../services/userService.js'

function getQueryErrorMessage(error) {
  if (error?.code === '42501' || error?.status === 403) {
    return 'O acesso a esta lista está bloqueado pelas políticas RLS do Supabase. Configure uma policy de leitura para esta organização e papel.'
  }

  return error?.message ?? 'Não foi possível carregar os dados.'
}

export function useSettingsPageState({ user, membership }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [commonAreas, setCommonAreas] = useState([])
  const [residents, setResidents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [areasError, setAreasError] = useState('')
  const [residentsError, setResidentsError] = useState('')
  const [isCreatingResident, setIsCreatingResident] = useState(false)
  const [isRemovingResident, setIsRemovingResident] = useState(false)

  const activeSection = searchParams.get('section') ?? 'account'
  const profile = buildUserProfile(user, membership)

  useEffect(() => {
    const organisationId = membership?.organisation_id

    let isCurrent = true

    async function loadSettingsData() {
      setIsLoading(true)
      setAreasError('')
      setResidentsError('')

      const [areasResult, residentsResult] = await Promise.allSettled([
        fetchCommonAreas(organisationId),
        fetchResidents(organisationId),
      ])

      if (!isCurrent) {
        return
      }

      setCommonAreas(areasResult.status === 'fulfilled' ? areasResult.value : [])
      setResidents(residentsResult.status === 'fulfilled' ? residentsResult.value : [])
      setAreasError(areasResult.status === 'rejected' ? getQueryErrorMessage(areasResult.reason) : '')
      setResidentsError(residentsResult.status === 'rejected' ? getQueryErrorMessage(residentsResult.reason) : '')
      setIsLoading(false)
    }

    if (organisationId) {
      loadSettingsData()
    }

    return () => {
      isCurrent = false
    }
  }, [membership?.organisation_id])

  const setActiveSection = (sectionId) => setSearchParams({ section: sectionId })

  const createResident = async ({ name, cpf, block, unitNumber }) => {
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

  const deleteResident = async (userId) => {
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

  return {
    activeSection,
    setActiveSection,
    profile,
    commonAreas: membership?.organisation_id ? commonAreas : [],
    residents: membership?.organisation_id ? residents : [],
    isLoading: Boolean(membership?.organisation_id) && isLoading,
    areasError,
    residentsError,
    createResident,
    isCreatingResident,
    deleteResident,
    isRemovingResident,
  }
}
