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

export async function checkCpfExists(cpf) {
  const normalizedCpf = normalizeCpf(cpf)

  if (!normalizedCpf) {
    return false
  }

  const { data, error } = await supabase.from('users').select('id').eq('cpf', normalizedCpf).limit(1)

  if (error) {
    console.error('Erro ao validar CPF:', error)
    return false
  }

  return Array.isArray(data) ? data.length > 0 : Boolean(data)
}

export async function registerFirstAccess({ cpf, password }) {
  const normalizedCpf = normalizeCpf(cpf)

  if (!normalizedCpf) {
    throw new Error('CPF obrigatório.')
  }

  const cpfExists = await checkCpfExists(normalizedCpf)

  if (!cpfExists) {
    throw new Error('CPF não foi cadastrado, procure informações com seu sindico.')
  }

  if (!password || password.length < 8) {
    throw new Error('A senha deve ter no mínimo 8 caracteres.')
  }

  if (!/\d/.test(password)) {
    throw new Error('A senha deve conter pelo menos um número.')
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    throw new Error('A senha deve conter pelo menos um caractere especial.')
  }

  return { success: true }
}

export async function loginUser(credentials) {
  const cpf = normalizeCpf(credentials.cpf)

  const { data, error } = await supabase.functions.invoke('login-by-cpf', {
    body: {
      cpf,
      password: credentials.password,
    },
  })

  if (error) {
    console.error('Erro no login:', error)
    throw new Error('Erro ao realizar o login, cheque seu email e senha')
  }

  if (data?.access_token && data?.refresh_token) {
    await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    })
  }

  const authUser = data?.user ?? null
  const userData = authUser ? await supabase.from('users').select('id, name, auth_id, cpf').eq('auth_id', authUser.id).single() : null

  if (!authUser || userData?.error || !userData?.data) {
    throw new Error('Usuario autenticado, mas nao existe um perfil correspondente em public.users.')
  }

  const normalizedInputCpf = normalizeCpf(credentials.cpf)
  const normalizedUserCpf = normalizeCpf(userData.data.cpf)

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
    .eq('user_id', userData.data.id)
    .single()

  if (membershipError || !membershipData) {
    await supabase.auth.signOut()
    throw new Error('Usuario autenticado, mas nao possui vinculo com uma organizacao.')
  }

  return {
    auth: {
      access_token: data?.access_token,
      refresh_token: data?.refresh_token,
      user: {
        id: authUser.id,
        email: authUser.email,
      },
    },
    user: sanitizeUser(userData.data),
    membership: sanitizeMembership(membershipData),
  }
}
