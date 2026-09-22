import { useEffect, useState } from 'react'
import { CheckCircle, WarningCircle } from '@phosphor-icons/react'
import styles from './CpfInput.module.css'

function normalizeCpf(value = '') {
  return String(value ?? '').replace(/\D/g, '')
}

function formatCpf(value = '') {
  const digits = normalizeCpf(value)

  if (!digits) {
    return ''
  }

  if (digits.length <= 3) {
    return digits
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
}

function isValidCpf(value = '') {
  const digits = normalizeCpf(value)

  if (digits.length !== 11 || /^([0-9])\1+$/.test(digits)) {
    return false
  }

  let sum = 0

  for (let index = 0; index < 9; index += 1) {
    sum += Number(digits.charAt(index)) * (10 - index)
  }

  let firstVerifierDigit = 11 - (sum % 11)

  if (firstVerifierDigit >= 10) {
    firstVerifierDigit = 0
  }

  if (Number(digits.charAt(9)) !== firstVerifierDigit) {
    return false
  }

  sum = 0

  for (let index = 0; index < 10; index += 1) {
    sum += Number(digits.charAt(index)) * (11 - index)
  }

  let secondVerifierDigit = 11 - (sum % 11)

  if (secondVerifierDigit >= 10) {
    secondVerifierDigit = 0
  }

  return Number(digits.charAt(10)) === secondVerifierDigit
}

export default function CpfInput({
  id,
  label,
  name,
  value,
  onChange,
  onBlur,
  placeholder = '000.000.000-00',
  required = true,
  checkCpfExists,
  disabled = false,
  autoComplete = 'off',
}) {
  const [validationMessage, setValidationMessage] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    if (!value) {
      setValidationMessage('')
      setIsValid(false)
      return
    }

    const normalizedValue = normalizeCpf(value)

    if (!isValidCpf(normalizedValue)) {
      setValidationMessage('CPF inválido.')
      setIsValid(false)
      return
    }

    if (!checkCpfExists) {
      setValidationMessage('')
      setIsValid(true)
      return
    }

    let isMounted = true

    const validateCpfFromDatabase = async () => {
      setIsChecking(true)

      try {
        const exists = await checkCpfExists(normalizedValue)

        if (!isMounted) {
          return
        }

        if (exists) {
          setValidationMessage('')
          setIsValid(true)
          return
        }

        setValidationMessage('CPF não cadastrado.')
        setIsValid(false)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setValidationMessage('Não foi possível validar o CPF no momento.')
        setIsValid(false)
      } finally {
        if (isMounted) {
          setIsChecking(false)
        }
      }
    }

    validateCpfFromDatabase()

    return () => {
      isMounted = false
    }
  }, [checkCpfExists, value])

  const handleChange = (event) => {
    const nextValue = normalizeCpf(event.target.value).slice(0, 11)

    onChange({
      ...event,
      target: {
        ...event.target,
        name,
        value: nextValue,
      },
    })
  }

  const handleBlur = async (event) => {
    if (onBlur) {
      onBlur(event)
    }

    const normalizedValue = normalizeCpf(value)

    if (!normalizedValue) {
      setValidationMessage('')
      setIsValid(false)
      return
    }

    if (!isValidCpf(normalizedValue)) {
      setValidationMessage('CPF inválido.')
      setIsValid(false)
      return
    }

    if (!checkCpfExists) {
      setValidationMessage('')
      setIsValid(true)
      return
    }

    setIsChecking(true)

    try {
      const exists = await checkCpfExists(normalizedValue)

      if (exists) {
        setValidationMessage('')
        setIsValid(true)
        return
      }

      setValidationMessage('CPF não cadastrado.')
      setIsValid(false)
    } catch (error) {
      setValidationMessage('Não foi possível validar o CPF no momento.')
      setIsValid(false)
    } finally {
      setIsChecking(false)
    }
  }

  const messageVisible = Boolean(validationMessage)
  const statusIcon =
    isChecking ? (
      <span className={styles.statusText}>Validando...</span>
    ) : messageVisible ? (
      <WarningCircle size={18} weight="fill" className={styles.statusIconError} />
    ) : isValid ? (
      <CheckCircle size={18} weight="fill" className={styles.statusIconSuccess} />
    ) : null

  return (
    <div className={styles.fieldWrapper}>
      <label htmlFor={id}>{label}</label>

      <div
        className={`${styles.inputContainer} ${messageVisible ? styles.inputError : ''} ${
          !messageVisible && isValid ? styles.inputSuccess : ''
        }`}
      >
        <input
          id={id}
          type="text"
          name={name}
          value={formatCpf(value)}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          inputMode="numeric"
          aria-invalid={messageVisible}
          maxLength={14}
        />

        {statusIcon}
      </div>

      {messageVisible && <span className={styles.fieldMessageError}>{validationMessage}</span>}
    </div>
  )
}
