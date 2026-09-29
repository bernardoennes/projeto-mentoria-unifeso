import { useState } from 'react'
import Header from '../../components/Header/Header.jsx'
import Sidebar from '../../components/Sidebar/Sidebar.jsx'
import ToolCard from '../../components/ToolCard/ToolCard.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import styles from './HomePage.module.css'

const navItems = [
  { id: 'home', label: 'Home', iconName: 'House' },
  { id: 'reservas', label: 'Reservas', iconName: 'CalendarCheck' },
  { id: 'moradores', label: 'Moradores', iconName: 'UsersThree' },
  { id: 'financeiro', label: 'Financeiro', iconName: 'CurrencyDollar' },
  { id: 'pacotes', label: 'Encomendas', iconName: 'Package' },
]

const navIconById = navItems.reduce((acc, item) => {
  acc[item.id] = item.iconName
  return acc
}, {})

const toolItems = [
  {
    id: 'moradores',
    title: 'Moradores',
    value: '120 cadastrados',
    iconName: navIconById.moradores ?? 'UsersThree',
  },
  {
    id: 'reservas',
    title: 'Reservas hoje',
    value: '08 confirmadas',
    iconName: navIconById.reservas ?? 'CalendarCheck',
  },
  {
    id: 'avisos',
    title: 'Avisos',
    value: '03 pendentes',
    iconName: 'Megaphone',
  },
  {
    id: 'pacotes',
    title: 'Encomendas',
    value: '05 aguardando retirada',
    iconName: navIconById.pacotes ?? 'Package',
  },
  {
    id: 'financeiro',
    title: 'Taxa mensal',
    value: '94% adimplencia',
    iconName: navIconById.financeiro ?? 'CurrencyDollar',
  },
]

export default function HomePage() {
  const { user, membership } = useAuth()
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)

  const overlayClass = isSidebarExpanded ? ` ${styles.overlayVisible}` : ''
  const userName = user?.name ?? 'Usuario'
  const accessType = membership?.access_type ?? 'Nao definido'

  return (
    <div className={styles.pageShell}>
      <Header
        title="Condominio"
        subtitle="Sistema de Gerenciamento"
        userName={userName}
        accessType={accessType}
      />

      <div className={styles.pageBody}>
        <div className={`${styles.pageOverlay}${overlayClass}`} />

        <Sidebar
          items={navItems}
          expanded={isSidebarExpanded}
          onExpand={() => setIsSidebarExpanded(true)}
          onCollapse={() => setIsSidebarExpanded(false)}
        />

        <main className={styles.homeContent}>
          <h1>Home</h1>
          <p>
            Usuario atual: <strong>{userName}</strong> | Nivel: <strong>{accessType}</strong>
          </p>

          <section className={styles.summaryGrid}>
            {toolItems.map((tool) => (
              <ToolCard
                key={tool.id}
                title={tool.title}
                value={tool.value}
                iconName={tool.iconName}
              />
            ))}
          </section>
        </main>
      </div>
    </div>
  )
}
