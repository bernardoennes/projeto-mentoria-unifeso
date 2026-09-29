import { Link } from 'react-router-dom'
import Header from '../../components/Header/Header.jsx'
import SettingsSidebar from '../../components/settings/SettingsSidebar/SettingsSidebar.jsx'
import AccountSection from '../../components/settings/AccountSection/AccountSection.jsx'
import CommonAreasSection from '../../components/settings/CommonAreasSection/CommonAreasSection.jsx'
import ResidentsSection from '../../components/settings/ResidentsSection/ResidentsSection.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useSettingsPageState } from './hooks/useSettingsPageState.js'
import styles from './SettingsPage.module.css'

const sectionDefinitions = [
  { id: 'account', label: 'Minha conta' },
  { id: 'areas', label: 'Áreas comuns' },
  { id: 'residents', label: 'Moradores' },
]

export default function SettingsPage() {
  const { user, membership } = useAuth()
  const {
    activeSection,
    setActiveSection,
    profile,
    canManage,
    commonAreas,
    residents,
    isLoading,
    areasError,
    createArea,
    isCreatingArea,
    residentsError,
    createResident,
    isCreatingResident,
    deleteResident,
    isRemovingResident,
  } = useSettingsPageState({ user, membership })

  const visibleSections = canManage
    ? sectionDefinitions
    : sectionDefinitions.filter((section) => section.id === 'account')

  const renderSelectedSection = () => {
    switch (activeSection) {
      case 'areas':
        return (
          <CommonAreasSection
            items={commonAreas}
            error={areasError}
            canManage={canManage}
            onCreate={createArea}
            isCreating={isCreatingArea}
          />
        )
      case 'residents':
        return (
          <ResidentsSection
            items={residents}
            error={residentsError}
            canManage={canManage}
            onCreate={createResident}
            isCreating={isCreatingResident}
            onRemove={deleteResident}
            isRemoving={isRemovingResident}
          />
        )
      case 'account':
      default:
        return <AccountSection profile={profile} />
    }
  }

  return (
    <div className={styles.pageShell}>
      <Header
        title="Configurações"
        subtitle="Gestão da conta e condomínio"
        userName={profile?.name ?? 'Usuário'}
        accessType={profile?.access_type ?? 'Não definido'}
      />

      <div className={styles.settingsLayout}>
        <SettingsSidebar
          items={visibleSections}
          activeItem={activeSection}
          onSelect={setActiveSection}
        />

        <main className={styles.content}>
          <div className={styles.topBar}>
            <Link to="/" className={styles.homeLink}>
              Voltar para a home
            </Link>
          </div>

          {isLoading ? <div className={styles.loadingState}>Carregando configurações...</div> : renderSelectedSection()}
        </main>
      </div>
    </div>
  )
}
