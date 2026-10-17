import { Buildings, UserCircle, UsersThree } from '@phosphor-icons/react'
import Header from '../../components/Header/Header.jsx'
import SettingsSidebar from '../../components/settings/SettingsSidebar/SettingsSidebar.jsx'
import AccountSection from '../../components/settings/AccountSection/AccountSection.jsx'
import CommonAreasSection from '../../components/settings/CommonAreasSection/CommonAreasSection.jsx'
import ResidentsSection from '../../components/settings/ResidentsSection/ResidentsSection.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useSettingsPageState } from './hooks/useSettingsPageState.js'
import styles from './SettingsPage.module.css'

const sectionDefinitions = [
  { id: 'account', label: 'Minha conta', group: 'settings', icon: UserCircle },
  { id: 'areas', label: 'Áreas comuns', group: 'management', icon: Buildings },
  { id: 'residents', label: 'Moradores', group: 'management', icon: UsersThree },
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
            hideTitleOnMobile={visibleSections.length > 1}
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
            hideTitleOnMobile={visibleSections.length > 1}
            onCreate={createResident}
            isCreating={isCreatingResident}
            onRemove={deleteResident}
            isRemoving={isRemovingResident}
          />
        )
      case 'account':
      default:
        return (
          <AccountSection
            profile={profile}
            hideTitleOnMobile={visibleSections.length > 1}
          />
        )
    }
  }

  return (
    <div className={styles.pageShell}>
      <Header
        userName={profile?.name ?? 'Usuário'}
        accessType={profile?.access_type ?? 'Não definido'}
        isSettingsPage
      />

      <div className={styles.settingsLayout}>
        {visibleSections.length > 1 && (
          <SettingsSidebar
            items={visibleSections}
            activeItem={activeSection}
            onSelect={setActiveSection}
          />
        )}

        <main className={styles.content}>
          {isLoading
            ? <div className={styles.loadingState}>Carregando configurações...</div>
            : renderSelectedSection()}
        </main>
      </div>
    </div>
  )
}
