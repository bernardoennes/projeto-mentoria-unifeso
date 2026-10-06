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
  disabled = false,
  autoComplete = 'off',
  variant = 'default',
}) {
  const hasValue = Boolean(value)
  const isValid = hasValue && isValidCpf(normalizeCpf(value))
  const validationMessage = hasValue && !isValid ? 'CPF inválido.' : ''

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

  const messageVisible = Boolean(validationMessage)
  const statusIcon = messageVisible ? (
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
          onBlur={onBlur}
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
