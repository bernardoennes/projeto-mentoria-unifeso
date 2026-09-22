import { useState } from 'react'
import { Eye, EyeSlash } from '@phosphor-icons/react'
import styles from './PasswordInput.module.css'

export default function PasswordInput({
  id,
  label,
  name,
  value,
  onChange,
  placeholder = 'Digite sua senha',
  required = true,
  disabled = false,
  autoComplete = 'current-password',
}) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className={styles.fieldWrapper}>
      <label htmlFor={id}>{label}</label>

      <div className={styles.inputContainer}>
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
        />

        <button
          type="button"
          className={styles.passwordToggle}
          onClick={() => setShowPassword((previousState) => !previousState)}
          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {showPassword ? <EyeSlash size={18} weight="fill" /> : <Eye size={18} weight="fill" />}
        </button>
      </div>
    </div>
  )
}
