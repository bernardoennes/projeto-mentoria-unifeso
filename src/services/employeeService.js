import { supabase } from '../lib/supabase.js'
import { getEdgeFunctionError, getRequestError } from './edgeFunctionError.js'

function normalizeEmployee(item) {
  const membership = item.membership ?? {}
  const profile = membership.users ?? {}

  if (!profile.name) {
    throw new Error('Não foi possível carregar os dados dos funcionários. Tente novamente.')
  }

  return {
    id: item.organisation_user_id,
    userId: membership.user_id ?? profile.id,
    name: profile.name,
    cpfMasked: profile.cpf_masked?.replace(/x/gi, '*') ?? '',
    cargoCode: item.cargo_code ?? null,
  }
}

export async function fetchEmployees(organisationId) {
  if (!organisationId) {
    return []
  }

  const { data, error } = await supabase
    .from('organisation_employees')
    .select(`
      organisation_user_id,
      cargo_code,
      membership:organisation_users!inner(
        id,
        organisation_id,
        user_id,
        users(id, name, cpf_masked)
      )
    `)
    .eq('membership.organisation_id', organisationId)

  if (error) {
    throw getRequestError(error, 'Não foi possível carregar os funcionários. Tente novamente.')
  }

  return (data ?? []).map(normalizeEmployee)
}

export async function provisionFuncionario({ name, cpf, organisationId, cargoCode }) {
  const { data, error } = await supabase.functions.invoke('provision-funcionario', {
    body: {
      name,
      cpf,
      organisation_id: organisationId,
      cargo_code: cargoCode || null,
    },
  })

  if (error) {
    throw getEdgeFunctionError(error, 'Não foi possível cadastrar o funcionário. Tente novamente.')
  }

  return data
}

export async function updateEmployeeDetails({ membershipId, cargoCode }) {
  const { data, error } = await supabase
    .from('organisation_employees')
    .update({ cargo_code: cargoCode || null })
    .eq('organisation_user_id', membershipId)
    .select('organisation_user_id')

  if (error) {
    throw getRequestError(error, 'Não foi possível atualizar o funcionário. Tente novamente.')
  }

  if (!data?.length) {
    throw new Error('Você não tem permissão para editar este funcionário.')
  }
}

export async function removeFuncionario({ organisationId, userId }) {
  const { data, error } = await supabase.functions.invoke('remove-funcionario', {
    body: {
      organisation_id: organisationId,
      user_id: userId,
    },
  })

  if (error) {
    throw getEdgeFunctionError(error, 'Não foi possível remover o funcionário. Tente novamente.')
  }

  return data
}
