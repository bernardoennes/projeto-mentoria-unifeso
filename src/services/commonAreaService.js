import { supabase } from '../lib/supabase.js'

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
    throw error
  }

  return data ?? []
}
