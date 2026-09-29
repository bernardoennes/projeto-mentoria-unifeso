export function canManageCondominium(membership) {
  const accessType = String(membership?.access_type ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()

  return accessType === 'SINDICO'
}