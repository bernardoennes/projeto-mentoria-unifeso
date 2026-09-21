import { supabase } from '../lib/supabase.js'

function normalizeCpf(cpf) {
  return String(cpf ?? '').replace(/\D/g, '')
}

function sanitizeUser(user) {
  if (!user) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    auth_id: user.auth_id,
    cpf: user.cpf,
  }
}

function sanitizeMembership(membership) {
  if (!membership) {
    return null
  }

  return {
    id: membership.id,
    organisation_id: membership.organisation_id,
    user_id: membership.user_id,
    access_type: membership.access_type,
    block: membership.block,
    unit_number: membership.unit_number,
    organisations: membership.organisations,
  }
}

export async function loginUser(credentials) {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: credentials.cpf.trim(),
    password: credentials.password,
  })

  if (authError || !authData?.user?.id) {
    throw new Error('CPF ou senha invalidos.')
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, name, auth_id, cpf')
    .eq('auth_id', authData.user.id)
    .single()

  if (userError || !userData) {
    await supabase.auth.signOut()
    throw new Error('Usuario autenticado, mas nao existe um perfil correspondente em public.users.')
  }

  const normalizedInputCpf = normalizeCpf(credentials.cpf)
  const normalizedUserCpf = normalizeCpf(userData.cpf)

  if (normalizedInputCpf && normalizedUserCpf && normalizedInputCpf !== normalizedUserCpf) {
    await supabase.auth.signOut()
    throw new Error('CPF informado nao corresponde ao perfil autenticado.')
  }

  const { data: membershipData, error: membershipError } = await supabase
    .from('organisation_users')
    .select(`
      id,
      organisation_id,
      user_id,
      access_type,
      block,
      unit_number,
      organisations (
        id,
        name,
        address,
        address_number,
        complement,
        district,
        city,
        state,
        postal_code
      )
    `)
    .eq('user_id', userData.id)
    .single()

  if (membershipError || !membershipData) {
    await supabase.auth.signOut()
    throw new Error('Usuario autenticado, mas nao possui vinculo com uma organizacao.')
  }

  return {
    auth: {
      access_token: authData.session?.access_token,
      refresh_token: authData.session?.refresh_token,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    },
    user: sanitizeUser(userData),
    membership: sanitizeMembership(membershipData),
  }
}
