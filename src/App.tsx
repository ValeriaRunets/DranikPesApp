import { useState } from 'react'
import { AppDataProvider, useAppData } from './lib/AppData'
import { NavBar, type Tab } from './components/NavBar'
import { MascotPreview } from './components/MascotPreview'
import Today from './pages/Today'
import Stats from './pages/Stats'
import Potty from './pages/Potty'
import Onboarding from './pages/Onboarding'
import { DranikFace } from './components/mascot'

function Shell() {
  const { loading, error, currentTrainer, trainers } = useAppData()
  const [tab, setTab] = useState<Tab>('today')

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3">
        <DranikFace className="w-28 animate-wiggle" />
        <p className="font-bold text-ink-soft">Зову Драника…</p>
      </div>
    )
  }

  if (error && trainers.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <DranikFace className="w-28" />
        <p className="font-extrabold">Не получилось загрузить данные</p>
        <p className="text-sm text-ink-soft">{error}</p>
      </div>
    )
  }

  if (!currentTrainer) return <Onboarding />

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <main className="flex-1 pb-24">
        {tab === 'today' && <Today />}
        {tab === 'stats' && <Stats />}
        {tab === 'potty' && <Potty />}
      </main>
      <NavBar tab={tab} onChange={setTab} />
    </div>
  )
}

export default function App() {
  if (new URLSearchParams(window.location.search).has('mascot')) {
    return <MascotPreview />
  }
  return (
    <AppDataProvider>
      <Shell />
    </AppDataProvider>
  )
}
