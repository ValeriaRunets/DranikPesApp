import { useState } from 'react'
import { Sheet } from './Sheet'
import { useAppData } from '../lib/AppData'

/** Переключение «кто сейчас тренирует» + переименование профилей */
export function TrainerSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { trainers, currentTrainer, setCurrentTrainer, updateTrainer } = useAppData()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const saveName = async (id: string) => {
    const name = draft.trim()
    setEditingId(null)
    if (name) await updateTrainer(id, { name })
  }

  return (
    <Sheet open={open} onClose={onClose} title="Кто сейчас с Драником?">
      <div className="flex flex-col gap-2">
        {trainers.map((t) => {
          const active = t.id === currentTrainer?.id
          return (
            <div
              key={t.id}
              className={`flex items-center gap-3 rounded-2xl p-3 ${
                active ? 'bg-carrot-soft ring-2 ring-carrot' : 'bg-card shadow-sm'
              }`}
            >
              <button
                onClick={() => {
                  setCurrentTrainer(t.id)
                  onClose()
                }}
                className="flex flex-1 items-center gap-3 text-left"
              >
                <span
                  className="grid h-11 w-11 place-items-center rounded-full text-xl"
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
                  <span className="text-lg font-extrabold">{t.name}</span>
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
          )
        })}
      </div>
    </Sheet>
  )
}
