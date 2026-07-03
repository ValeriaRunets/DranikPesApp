import { useState } from 'react'
import { useAppData } from '../lib/AppData'
import { DranikSitting } from '../components/mascot'

/** Первый запуск: выбрать, кто ты (и при желании переименовать профили) */
export default function Onboarding() {
  const { trainers, setCurrentTrainer, updateTrainer } = useAppData()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const saveName = async (id: string) => {
    const name = draft.trim()
    setEditingId(null)
    if (name) await updateTrainer(id, { name })
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-5 p-6">
      <DranikSitting mood="happy" className="w-48 animate-pop" />
      <div className="text-center">
        <h1 className="text-3xl font-black">Привет! Я Драник 🐾</h1>
        <p className="mt-2 font-bold text-ink-soft">
          Здесь мы отмечаем мои тренировки.
          <br />
          А ты кто?
        </p>
      </div>
      <div className="flex w-full flex-col gap-3">
        {trainers.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-3xl bg-card p-3 shadow-sm"
          >
            <button
              onClick={() => setCurrentTrainer(t.id)}
              className="flex flex-1 items-center gap-3 text-left"
            >
              <span
                className="grid h-12 w-12 place-items-center rounded-full text-2xl"
                style={{ backgroundColor: `${t.color}33` }}
              >
                {t.emoji}
              </span>
              {editingId === t.id ? (
                <input
                  value={draft}
                  autoFocus
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => void saveName(t.id)}
                  onKeyDown={(e) => e.key === 'Enter' && void saveName(t.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full rounded-xl border-2 border-carrot bg-card px-2 py-1 text-lg font-bold outline-none"
                />
              ) : (
                <span className="text-lg font-extrabold">Это {t.name}</span>
              )}
            </button>
            <button
              aria-label={`Переименовать ${t.name}`}
              onClick={() => {
                setEditingId(t.id)
                setDraft(t.name)
              }}
              className="grid h-10 w-10 place-items-center rounded-full text-lg hover:bg-cream"
            >
              ✏️
            </button>
          </div>
        ))}
      </div>
      <p className="text-center text-xs font-bold text-ink-soft">
        Выбор запомнится на этом устройстве — потом можно
        <br />
        переключиться в шапке главного экрана.
      </p>
    </div>
  )
}
