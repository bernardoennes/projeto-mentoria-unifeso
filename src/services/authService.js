import { supabase } from '../lib/supabase.js'
import { getEdgeFunctionError, getRequestError } from './edgeFunctionError.js'

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
    cpf_masked: user.cpf_masked,
  }
}

function sanitizeMembership(membership) {
  if (!membership) {
    return null
  }

  return {
    organisation_id: membership.organisation_id,
    access_type: membership.access_type,
  }
}

export async function registerFirstAccess({ cpf, password }) {
  const normalizedCpf = normalizeCpf(cpf)

  if (!normalizedCpf) {
    throw new Error('CPF obrigatório.')
  }

  if (!password || password.length < 8) {
    throw new Error('A senha deve ter entre 8 e 128 caracteres.')
  }

  if (password.length > 128) {
    throw new Error('A senha deve ter entre 8 e 128 caracteres.')
  }

  const { data, error } = await supabase.functions.invoke('complete-first-access', {
    body: { cpf: normalizedCpf, password },
  })

  if (error) {
    throw await getEdgeFunctionError(
      error,
      'Não foi possível concluir o primeiro acesso. Verifique os dados e tente novamente.',
    )
  }

  return data
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
    throw getRequestError(error, 'Não foi possível entrar. Confira o CPF e a senha e tente novamente.')
  }

  if (!data?.access_token || !data?.refresh_token) {
    throw new Error('Não foi possível iniciar sua sessão. Tente novamente.')
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  })

  if (sessionError || !sessionData?.session?.user?.id) {
    await supabase.auth.signOut()
    throw getRequestError(sessionError, 'Não foi possível iniciar sua sessão. Tente novamente.')
  }

  const { session } = sessionData
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles_safe')
    .select('id,name,auth_id,cpf_masked')
    .eq('auth_id', session.user.id)
    .single()

  if (profileError || !profile) {
    await supabase.auth.signOut()
    throw getRequestError(profileError, 'Não foi possível carregar seu perfil. Tente novamente.')
  }

  const { data: membership, error: membershipError } = await supabase
    .from('organisation_users')
    .select('organisation_id, access_type')
    .eq('user_id', profile.id)
    .single()

  if (membershipError || !membership) {
    await supabase.auth.signOut()
    throw getRequestError(membershipError, 'Não foi possível carregar seu acesso ao condomínio.')
  }

  return {
    auth: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user: {
        id: session.user.id,
      },
    },
    user: sanitizeUser(profile),
    membership: sanitizeMembership(membership),
  }
}
