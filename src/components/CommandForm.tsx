import { useState } from 'react'
import { Sheet } from './Sheet'
import { CATEGORY_META, type Category, type Command } from '../lib/types'

const EMOJI_PRESETS = [
  '🪑', '🛋️', '🏃', '🚶', '🧺', '⏳', '🤝', '📣', '🌀', '✋',
  '🦴', '🎾', '🐾', '🔄', '🛑', '👃', '🎯', '🪄', '🤸', '💤',
  '🙊', '🫴', '↩️', '🎪',
]

export function CommandForm({
  open,
  command,
  onClose,
  onSave,
  onArchive,
}: {
  open: boolean
  /** null — создание новой команды */
  command: Command | null
  onClose: () => void
  onSave: (input: { name: string; emoji: string; category: Category }) => void
  onArchive?: () => void
}) {
  const [name, setName] = useState(command?.name ?? '')
  const [emoji, setEmoji] = useState(command?.emoji ?? '🐾')
  const [category, setCategory] = useState<Category>(command?.category ?? 'useful')

  const canSave = name.trim().length > 0

  return (
    <Sheet open={open} onClose={onClose} title={command ? 'Изменить команду' : 'Новая команда'}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-card text-3xl shadow-sm">
            {emoji}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название команды"
            autoFocus={!command}
            className="h-14 w-full rounded-2xl border-2 border-line bg-card px-4 text-lg font-bold outline-none focus:border-carrot"
          />
        </div>

        <div className="rounded-2xl bg-card p-3 shadow-sm">
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_PRESETS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`grid aspect-square place-items-center rounded-xl text-xl ${
                  e === emoji ? 'bg-carrot-soft ring-2 ring-carrot' : 'hover:bg-cream'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {(Object.keys(CATEGORY_META) as Category[]).map((c) => {
            const active = category === c
            const meta = CATEGORY_META[c]
            const activeCls =
              c === 'fun'
                ? 'bg-fun-soft ring-2 ring-fun text-ink'
                : 'bg-useful-soft ring-2 ring-useful text-ink'
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`h-12 flex-1 rounded-2xl font-extrabold ${
                  active ? activeCls : 'bg-card text-ink-soft shadow-sm'
                }`}
              >
                {meta.emoji} {meta.label}
              </button>
            )
          })}
        </div>

        <button
          disabled={!canSave}
          onClick={() => onSave({ name: name.trim(), emoji, category })}
          className="h-14 rounded-2xl bg-carrot text-lg font-extrabold text-white shadow-md disabled:opacity-40"
        >
          {command ? 'Сохранить' : 'Добавить команду'}
        </button>

        {command && onArchive && (
          <button onClick={onArchive} className="text-sm font-bold text-ink-soft">
            🗄️ Убрать в архив (статистика сохранится)
          </button>
        )}
      </div>
    </Sheet>
  )
}
