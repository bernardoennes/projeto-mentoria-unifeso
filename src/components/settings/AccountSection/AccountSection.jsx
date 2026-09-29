import { useState } from 'react'
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
  const [isSavingPassword, setIsSavingPassword] = useState(false)

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
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Senha atual"
            required
            value={passwordForm.currentPassword}
            onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Nova senha"
            required
            value={passwordForm.newPassword}
            onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Confirmar nova senha"
            required
            value={passwordForm.confirmPassword}
            onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
          />
        </div>
        <button type="submit" className={styles.primaryButton} disabled={isSavingPassword}>
          {isSavingPassword ? 'Salvando...' : 'Salvar senha'}
        </button>
      </form>
    </section>
  )
}
