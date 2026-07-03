export type Tab = 'today' | 'stats' | 'potty'

const TABS: Array<{ id: Tab; label: string; emoji: string }> = [
  { id: 'today', label: 'Сегодня', emoji: '🦴' },
  { id: 'stats', label: 'Статистика', emoji: '📊' },
  { id: 'potty', label: 'Туалет', emoji: '💧' },
]

export function NavBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg">
        {TABS.map((t) => {
          const active = t.id === tab
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-bold transition-colors ${
                active ? 'text-carrot-deep' : 'text-ink-soft'
              }`}
            >
              <span
                className={`grid h-8 w-14 place-items-center rounded-full text-lg transition-colors ${
                  active ? 'bg-carrot-soft' : ''
                }`}
              >
                {t.emoji}
              </span>
              {t.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
