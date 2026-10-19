import { supabase } from '../lib/supabase.js'
import { getEdgeFunctionError, getRequestError } from './edgeFunctionError.js'

function normalizeResident(item) {
  const membership = item.membership ?? {}
  const profile = membership.users ?? {}

  if (!profile.name) {
    throw new Error('Não foi possível carregar os dados dos moradores. Tente novamente.')
  }

  return {
    id: item.organisation_user_id,
    userId: membership.user_id ?? profile.id,
    name: profile.name,
    cpfMasked: profile.cpf_masked?.replace(/x/gi, '*') ?? '',
    block: item.block,
    unit_number: item.unit_number,
  }
}

export async function fetchResidents(organisationId) {
  if (!organisationId) {
    return []
  }

  const { data, error } = await supabase
    .from('organisation_residents')
    .select(`
      organisation_user_id,
      block,
      unit_number,
      membership:organisation_users!inner(
        id,
        organisation_id,
        user_id,
        users(id, name, cpf_masked)
      )
    `)
    .eq('membership.organisation_id', organisationId)
    .eq('membership.access_type', 'CONDOMINO')

  if (error) {
    throw getRequestError(error, 'Não foi possível carregar os moradores. Tente novamente.')
  }

  return (data ?? []).map(normalizeResident)
}

export async function provisionCondomino({ name, cpf, organisationId, block, unitNumber }) {
  const { data, error } = await supabase.functions.invoke('provision-condomino', {
    body: {
      name,
      cpf,
      organisation_id: organisationId,
      block,
      unit_number: unitNumber,
    },
  })

  if (error) {
    throw getEdgeFunctionError(error, 'Não foi possível cadastrar o morador. Tente novamente.')
  }

  return data
}

export async function updateResidentDetails({ membershipId, block, unitNumber }) {
  const { data, error } = await supabase
    .from('organisation_residents')
    .update({ block, unit_number: unitNumber })
    .eq('organisation_user_id', membershipId)
    .select('organisation_user_id')

  if (error) {
    throw getRequestError(error, 'Não foi possível atualizar o morador. Tente novamente.')
  }

  if (!data?.length) {
    throw new Error('Você não tem permissão para editar este morador.')
  }
}

export async function removeCondomino({ organisationId, userId }) {
  const { data, error } = await supabase.functions.invoke('remove-condomino', {
    body: {
      organisation_id: organisationId,
      user_id: userId,
    },
  })

  if (error) {
    throw getEdgeFunctionError(error, 'Não foi possível remover o morador. Tente novamente.')
  }

  return data
}
