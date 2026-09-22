import AuthForm from '../../components/auth/AuthForm/AuthForm.jsx'
import styles from './AuthPage.module.css'

export default function AuthPage({ mode = 'login' }) {
  return (
    <main className={styles.authShell}>
      <AuthForm mode={mode} />
    </main>
  )
}
