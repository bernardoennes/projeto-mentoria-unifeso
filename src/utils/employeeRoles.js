export const EMPLOYEE_ROLES = [
  { value: 'ZELADOR', label: 'Zelador' },
  { value: 'PORTEIRO', label: 'Porteiro' },
  { value: 'JARDINEIRO', label: 'Jardineiro' },
  { value: 'FAXINEIRO', label: 'Faxineiro' },
  { value: 'VIGILANTE', label: 'Vigilante' },
  { value: 'MANOBRISTA', label: 'Manobrista' },
  { value: 'ELETRICISTA', label: 'Eletricista' },
  { value: 'ENCANADOR', label: 'Encanador' },
  { value: 'SALVA_VIDAS', label: 'Salva-vidas' },
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
  { value: 'OUTRO', label: 'Outro' },
]

export function getEmployeeRoleLabel(code) {
  if (!code) {
    return 'Não informado'
  }

  return EMPLOYEE_ROLES.find((role) => role.value === code)?.label ?? code
}

// Mantém cargos antigos (texto livre) selecionáveis no dropdown
export function getEmployeeRoleOptions(currentCode) {
  if (currentCode && !EMPLOYEE_ROLES.some((role) => role.value === currentCode)) {
    return [{ value: currentCode, label: currentCode }, ...EMPLOYEE_ROLES]
  }

  return EMPLOYEE_ROLES
}
