import { supabase } from '../lib/supabase.js'
import { getEdgeFunctionError, getRequestError } from './edgeFunctionError.js'

export const AREA_TYPE_LABELS = {
  SWIMMING_POOL: 'Piscina',
  TERRACE: 'Terraço',
  BARBECUE_AREA: 'Churrasqueira',
  PARTY_HALL: 'Salão de festas',
  GAME_ROOM: 'Salão de jogos',
  GYM: 'Academia',
  SAUNA: 'Sauna',
  EVENT_SPACE: 'Espaço de eventos',
}

export async function fetchCommonAreas(organisationId) {
  if (!organisationId) {
    return []
  }

  const { data, error } = await supabase
    .from('areas')
    .select('id, area_type, organisation_id, available_weekdays, start_hour, end_hour')
    .eq('organisation_id', organisationId)
    .order('id')

  if (error) {
    throw getRequestError(error, 'Não foi possível carregar as áreas comuns. Tente novamente.')
  }

  return data ?? []
}

export async function createCommonArea({
  organisationId,
  areaType,
  availableWeekdays,
  startHour,
  endHour,
}) {
  const { data, error } = await supabase.functions.invoke('create-area', {
    body: {
      organisation_id: organisationId,
      area_type: areaType,
      available_weekdays: availableWeekdays,
      start_hour: startHour || null,
      end_hour: endHour || null,
    },
  })

  if (error) {
    throw await getEdgeFunctionError(error, 'Não foi possível cadastrar a área comum. Tente novamente.')
  }

  return data
}
