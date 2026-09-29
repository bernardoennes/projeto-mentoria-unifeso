import { useEffect, useState } from 'react'
import { CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { formatCpf, isValidCpf, normalizeCpf } from '../../../utils/cpfValidation.js'
import styles from './CpfInput.module.css'

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
  variant = 'default',
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
    <div className={`${styles.fieldWrapper} ${variant === 'settings' ? styles.settingsFieldWrapper : ''}`}>
      <label className={variant === 'settings' ? styles.visuallyHidden : undefined} htmlFor={id}>
        {label}
      </label>

      <div
        className={`${styles.inputContainer} ${variant === 'settings' ? styles.settingsInputContainer : ''} ${messageVisible ? styles.inputError : ''} ${
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
