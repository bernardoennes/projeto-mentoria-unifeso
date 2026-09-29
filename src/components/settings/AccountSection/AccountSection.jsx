import { useState } from 'react'
import { Eye, EyeSlash } from '@phosphor-icons/react'
import { toast } from 'react-toastify'
import InfoField from '../InfoField/InfoField.jsx'
import { updatePassword } from '../../../services/userService.js'
import styles from './AccountSection.module.css'

const accountFields = [
  { label: 'Nome', key: 'name' },
  { label: 'CPF', key: 'cpf' },
  { label: 'Perfil', key: 'access_type' },
]

export default function AccountSection({ profile }) {
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [visiblePasswords, setVisiblePasswords] = useState({})
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const passwordFields = [
    { name: 'currentPassword', label: 'Senha atual', autoComplete: 'current-password' },
    { name: 'newPassword', label: 'Nova senha', autoComplete: 'new-password' },
    { name: 'confirmPassword', label: 'Confirmar nova senha', autoComplete: 'new-password' },
  ]

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()

    if (passwordForm.newPassword.length < 8 || passwordForm.newPassword.length > 128) {
      toast.error('A nova senha deve ter entre 8 e 128 caracteres.')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('A confirmação da nova senha não confere.')
      return
    }

    setIsSavingPassword(true)

    try {
      await updatePassword(passwordForm)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setVisiblePasswords({})
      toast.success('Senha alterada com sucesso.')
    } catch (error) {
      toast.error(error.message ?? 'Não foi possível alterar a senha.')
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <section className={styles.panel}>
      <h2>Minha conta</h2>

      <div className={styles.infoGrid}>
        {accountFields.map((field) => (
          <InfoField
            key={field.key}
            label={field.label}
            value={profile?.[field.key] ?? 'Não informado'}
          />
        ))}
      </div>

      <form className={styles.formBlock} onSubmit={handlePasswordSubmit}>
        <h3>Alterar senha</h3>
        <div className={styles.inlineFields}>
          {passwordFields.map((field) => {
            const isVisible = Boolean(visiblePasswords[field.name])
            const VisibilityIcon = isVisible ? EyeSlash : Eye

            return (
              <label key={field.name} className={styles.passwordField}>
                <span>{field.label}</span>
                <div className={styles.passwordInputWrapper}>
                  <input
                    type={isVisible ? 'text' : 'password'}
                    autoComplete={field.autoComplete}
                    required
                    value={passwordForm[field.name]}
                    onChange={(event) =>
                      setPasswordForm({ ...passwordForm, [field.name]: event.target.value })
                    }
                  />
                  <button
                    type="button"
                    className={styles.visibilityButton}
                    onClick={() =>
                      setVisiblePasswords((current) => ({
                        ...current,
                        [field.name]: !current[field.name],
                      }))
                    }
                    aria-label={`${isVisible ? 'Ocultar' : 'Mostrar'} ${field.label.toLowerCase()}`}
                    title={`${isVisible ? 'Ocultar' : 'Mostrar'} ${field.label.toLowerCase()}`}
                  >
                    <VisibilityIcon size={18} aria-hidden="true" />
                  </button>
                </div>
              </label>
            )
          })}
        </div>
        <button type="submit" className={styles.primaryButton} disabled={isSavingPassword}>
          {isSavingPassword ? 'Salvando...' : 'Salvar senha'}
        </button>
      </form>
    </section>
  )
}
