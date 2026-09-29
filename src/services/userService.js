import { supabase } from '../lib/supabase.js'

export function maskCpf(cpf) {
  const digits = String(cpf ?? '').replace(/\D/g, '')

  if (digits.length < 4) {
    return digits
  }

  const first = digits.slice(0, 3)
  const last = digits.slice(-2)
  return `${first}.***.***-${last}`
}

export async function updatePassword({ currentPassword, newPassword }) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
    ...(currentPassword ? { currentPassword } : {}),
  })

  if (error) {
    throw error
  }
}

export function buildUserProfile(user, membership) {
  if (!user) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    cpf: user.cpf_masked?.replace(/x/gi, '*') ?? maskCpf(user.cpf),
    access_type: membership?.access_type ?? 'Não definido',
    organisation_id: membership?.organisation_id ?? null,
  }
}
