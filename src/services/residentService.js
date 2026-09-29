import { supabase } from '../lib/supabase.js'
import { getEdgeFunctionError } from './edgeFunctionError.js'

function normalizeResident(item) {
  const profile = item.users ?? {}

  if (!profile.name) {
    const returnedColumns = Object.keys(item).join(', ')
    const profileColumns = Object.keys(profile).join(', ')
    throw new Error(
      `A RPC get_organisation_condominos não retornou users.name. Colunas recebidas: ${returnedColumns || 'nenhuma'}; users: ${profileColumns || 'nenhum campo'}.`,
    )
  }

  return {
    id: item.id,
    userId: profile.id,
    name: profile.name,
    cpfMasked: profile.cpf_masked?.replace(/x/gi, '*') ?? '',
    role: item.access_type ?? 'CONDOMINO',
    block: item.block,
    unit_number: item.unit_number,
  }
}

export async function fetchResidents(organisationId) {
  if (!organisationId) {
    return []
  }

  const { data, error } = await supabase.rpc('get_organisation_condominos', {
    p_organisation_id: organisationId,
  })

  if (error) {
    throw error
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
    throw await getEdgeFunctionError(error)
  }

  return data
}

export async function removeCondomino({ organisationId, userId }) {
  const { data, error } = await supabase.functions.invoke('remove-condomino', {
    body: {
      organisation_id: organisationId,
      user_id: userId,
    },
  })

  if (error) {
    throw await getEdgeFunctionError(error)
  }

  return data
}
