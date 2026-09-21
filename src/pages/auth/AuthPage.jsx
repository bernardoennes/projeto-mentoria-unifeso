import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import styles from './AuthPage.module.css'

const initialFormState = {
  cpf: '',
  password: '',
}

export default function AuthPage() {
  const { signIn, error, clearError, isLoading } = useAuth()
  const [formState, setFormState] = useState(initialFormState)

  const handleFieldChange = (event) => {
    const { name, value } = event.target

    setFormState((previousState) => ({
      ...previousState,
      [name]: value,
    }))
  }

  const resetSensitiveFields = () => {
    setFormState((previousState) => ({
      ...previousState,
      password: '',
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    clearError()
    await signIn(formState)
    resetSensitiveFields()
  }

  return (
    <main className={styles.authShell}>
      <section className={styles.authCard}>
        <h1>Login</h1>
        <p>Entre com seu CPF e senha.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label htmlFor="cpf">CPF</label>
          <input
            id="cpf"
            type="text"
            name="cpf"
            value={formState.cpf}
            onChange={handleFieldChange}
            placeholder="Ex.: 00000000000"
            required
          />

          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            name="password"
            value={formState.password}
            onChange={handleFieldChange}
            placeholder="Digite sua senha"
            required
          />

          {error && <div className={styles.errorBox}>{error}</div>}

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Processando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  )
}
