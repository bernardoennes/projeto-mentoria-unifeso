import { CheckCircle, XCircle } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../../../context/AuthContext.jsx'
import { supabase } from '../../../lib/supabase.js'
import { registerFirstAccess } from '../../../services/authService.js'
import { isValidCpf, normalizeCpf } from '../../../utils/cpfValidation.js'
import CpfInput from '../CpfInput/CpfInput.jsx'
import PasswordInput from '../PasswordInput/PasswordInput.jsx'
import styles from './AuthForm.module.css'

const LOGIN_LOCK_KEY = 'condominio:loginLock'
const LOGIN_LOCK_DURATION_MS = 5 * 60 * 1000
const MAX_LOGIN_ATTEMPTS = 5

const initialFormState = {
  cpf: '',
  password: '',
  confirmPassword: '',
}

const passwordRules = [
  { key: 'length', label: 'Até 8 caracteres', test: (value) => value.length >= 8 },
  { key: 'number', label: 'Conter número', test: (value) => /\d/.test(value) },
  { key: 'special', label: 'Conter caractere especial', test: (value) => /[^A-Za-z0-9]/.test(value) },
]

function getPasswordValidation(password) {
  return passwordRules.map((rule) => ({
    ...rule,
    isValid: rule.test(password),
  }))
}

function readLoginLockState() {
  try {
    const rawValue = localStorage.getItem(LOGIN_LOCK_KEY)

    if (!rawValue) {
      return { attempts: 0, lockedUntil: 0 }
    }

    const parsedValue = JSON.parse(rawValue)

    return {
      attempts: Number(parsedValue?.attempts ?? 0),
      lockedUntil: Number(parsedValue?.lockedUntil ?? 0),
    }
  } catch {
    return { attempts: 0, lockedUntil: 0 }
  }
}

function persistLoginLockState(nextState) {
  localStorage.setItem(LOGIN_LOCK_KEY, JSON.stringify(nextState))
}

function clearLoginLockState() {
  localStorage.removeItem(LOGIN_LOCK_KEY)
}

function getRemainingLockSeconds(lockedUntil) {
  const remainingMs = Math.max(0, lockedUntil - Date.now())
  return Math.ceil(remainingMs / 1000)
}

export default function AuthForm({ mode = 'login' }) {
  const navigate = useNavigate()
  const { signIn, error, clearError, isLoading } = useAuth()
  const [formState, setFormState] = useState(initialFormState)
  const [formError, setFormError] = useState('')
  const [passwordChecks, setPasswordChecks] = useState(getPasswordValidation(''))
  const [lockoutSeconds, setLockoutSeconds] = useState(0)
  const isFirstAccess = mode === 'first-access'

  useEffect(() => {
    if (isFirstAccess) {
      return undefined
    }

    const syncLockState = () => {
      const lockState = readLoginLockState()
      const remainingSeconds = getRemainingLockSeconds(lockState.lockedUntil)

      if (lockState.lockedUntil && remainingSeconds <= 0) {
        clearLoginLockState()
        setLockoutSeconds(0)
        return
      }

      setLockoutSeconds(remainingSeconds)
    }

    syncLockState()
    const timer = window.setInterval(syncLockState, 1000)

    const onStorageUpdate = (event) => {
      if (event.key === LOGIN_LOCK_KEY) {
        syncLockState()
      }
    }

    window.addEventListener('storage', onStorageUpdate)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('storage', onStorageUpdate)
    }
  }, [isFirstAccess])

  const handleFieldChange = (event) => {
    const { name, value } = event.target

    setFormState((previousState) => ({
      ...previousState,
      [name]: value,
    }))

    if (name === 'password') {
      setPasswordChecks(getPasswordValidation(value))
    }

    if (formError) {
      setFormError('')
    }
  }

  const checkCpfExistsInDatabase = async (cpf) => {
    const normalizedCpf = normalizeCpf(cpf)

    if (!normalizedCpf) {
      return false
    }

    const { data, error: cpfError } = await supabase
      .from('users')
      .select('id')
      .eq('cpf', normalizedCpf)
      .limit(1)

    if (cpfError) {
      console.error('Erro ao validar CPF:', cpfError)
      return false
    }

    return Array.isArray(data) ? data.length > 0 : Boolean(data)
  }

  const resetSensitiveFields = () => {
    setFormState((previousState) => ({
      ...previousState,
      password: '',
      confirmPassword: '',
    }))
    setPasswordChecks(getPasswordValidation(''))
    clearLoginLockState()
  }

  const handleLoginFailure = () => {
    const currentLockState = readLoginLockState()
    const nextAttempts = Number(currentLockState.attempts ?? 0) + 1

    if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
      const nextLockState = {
        attempts: nextAttempts,
        lockedUntil: Date.now() + LOGIN_LOCK_DURATION_MS,
      }

      persistLoginLockState(nextLockState)
      setLockoutSeconds(getRemainingLockSeconds(nextLockState.lockedUntil))
      toast.error('Erro ao realizar o login, cheque seu email e senha. Conta bloqueada por 5 minutos.')
      return
    }

    persistLoginLockState({
      attempts: nextAttempts,
      lockedUntil: 0,
    })

    setLockoutSeconds(0)
    toast.error('Erro ao realizar o login, cheque seu email e senha')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    clearError()
    setFormError('')

    if (!isFirstAccess) {
      const persistedLockState = readLoginLockState()
      const remainingSeconds = getRemainingLockSeconds(persistedLockState.lockedUntil)

      if (persistedLockState.lockedUntil && remainingSeconds > 0) {
        setLockoutSeconds(remainingSeconds)
        toast.error(`Muitas tentativas. Tente novamente em ${remainingSeconds} segundos.`)
        return
      }

      if (persistedLockState.lockedUntil && remainingSeconds <= 0) {
        clearLoginLockState()
      }
    }

    const normalizedCpf = normalizeCpf(formState.cpf)

    if (!normalizedCpf || !isValidCpf(normalizedCpf)) {
      const message = 'CPF inválido.'

      if (isFirstAccess) {
        toast.error(message)
        return
      }

      setFormError(message)
      return
    }

    if (isFirstAccess) {
      const existsInDatabase = await checkCpfExistsInDatabase(normalizedCpf)

      if (!existsInDatabase) {
        toast.error('CPF não foi cadastrado, procure informações com seu sindico.')
        return
      }

      const invalidRule = passwordChecks.find((rule) => !rule.isValid)

      if (invalidRule) {
        toast.error(`A senha deve conter ${invalidRule.label.toLowerCase()}.`)
        return
      }

      if (formState.password !== formState.confirmPassword) {
        toast.error('As senhas não coincidem.')
        return
      }

      try {
        await registerFirstAccess({
          cpf: normalizedCpf,
          password: formState.password,
        })

        toast.success('Cadastro realizado com sucesso!')
        resetSensitiveFields()
        navigate('/login')
      } catch (registerError) {
        toast.error(registerError.message)
      }

      return
    }

    const signedIn = await signIn({
      cpf: normalizedCpf,
      password: formState.password,
    })

    if (signedIn) {
      clearLoginLockState()
      setLockoutSeconds(0)
      resetSensitiveFields()
      return
    }

    handleLoginFailure()
  }

  const displayError = !isFirstAccess ? formError || error : null

  return (
    <section className={styles.authCard}>
      <h1>{isFirstAccess ? 'Primeiro acesso' : 'Login'}</h1>
      <p>
        {isFirstAccess ? 'Informe seu CPF e defina sua senha.' : 'Entre com seu CPF e senha.'}
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <CpfInput
          id="cpf"
          label="CPF"
          name="cpf"
          value={formState.cpf}
          onChange={handleFieldChange}
          checkCpfExists={isFirstAccess ? checkCpfExistsInDatabase : undefined}
          placeholder="000.000.000-00"
        />

        <PasswordInput
          id="password"
          label="Senha"
          name="password"
          value={formState.password}
          onChange={handleFieldChange}
          placeholder={isFirstAccess ? 'Crie sua senha' : 'Digite sua senha'}
        />

        {isFirstAccess && (
          <div className={styles.passwordList}>
            {passwordChecks.map((rule) => {
              const Icon = rule.isValid ? CheckCircle : XCircle

              return (
                <div
                  key={rule.key}
                  className={`${styles.passwordRule} ${
                    rule.isValid ? styles.passwordRuleValid : styles.passwordRuleInvalid
                  }`}
                >
                  <Icon size={16} weight="fill" />
                  <span>{rule.label}</span>
                </div>
              )
            })}
          </div>
        )}

        {isFirstAccess && (
          <PasswordInput
            id="confirmPassword"
            label="Confirme sua senha"
            name="confirmPassword"
            value={formState.confirmPassword}
            onChange={handleFieldChange}
            placeholder="Repita sua senha"
          />
        )}

        {displayError && <div className={styles.errorBox}>{displayError}</div>}

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading || (!isFirstAccess && lockoutSeconds > 0)}
        >
          {isLoading
            ? 'Processando...'
            : isFirstAccess
              ? 'Cadastrar senha'
              : lockoutSeconds > 0
                ? `Bloqueado (${lockoutSeconds}s)`
                : 'Entrar'}
        </button>

        {!isFirstAccess && (
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => navigate('/primeiro-acesso')}
          >
            Não tem conta? <span>Acesse aqui</span>
          </button>
        )}
      </form>
    </section>
  )
}
