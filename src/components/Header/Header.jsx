import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProfileModal from '../ProfileModal/ProfileModal.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import styles from './Header.module.css'

export default function Header({ title, subtitle, userName, accessType, onLogout }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleLogout = async () => {
    setIsProfileOpen(false)

    if (onLogout) {
      await onLogout()
    } else {
      await signOut()
    }

    navigate('/login', { replace: true })
  }

  const handleOpenSettings = () => {
    setIsProfileOpen(false)
    navigate('/settings?section=account')
  }

  return (
    <header className={styles.header}>
      <div className={styles.brandBlock}>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>

      <div className={styles.headerActions}>
        <div className={styles.profileWrapper}>
          <button
            type="button"
            className={styles.profileTrigger}
            onClick={() => setIsProfileOpen((current) => !current)}
          >
            <span>{userName}</span>
            <small>{accessType}</small>
          </button>

          {isProfileOpen && (
            <ProfileModal
              userName={userName}
              accessType={accessType}
              onClose={() => setIsProfileOpen(false)}
              onOpenSettings={handleOpenSettings}
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>
    </header>
  )
}
