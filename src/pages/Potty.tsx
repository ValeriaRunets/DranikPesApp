import { useMemo } from 'react'
import { useAppData } from '../lib/AppData'
import { dayKey, formatDayTitle, formatTime, pluralize, startOfDay } from '../lib/dates'
import { POTTY_META, type PottyEvent, type PottyType } from '../lib/types'
import { DranikHappy, DranikSitting } from '../components/mascot'
import { Snackbar, useSnackbar } from '../components/Snackbar'

const BTN_STYLES: Record<PottyType, string> = {
  pad: 'bg-carrot-soft text-carrot-deep ring-carrot/30',
  miss: 'bg-bad-soft text-bad-deep ring-bad/30',
  asphalt: 'bg-cream-deep text-ink ring-ink/15',
}

export default function Potty() {
  const { potty, trainers, addPotty, deletePotty } = useAppData()
  const { snack, show, hide } = useSnackbar()

  const sorted = useMemo(
    () => [...potty].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [potty],
  )

  // Стрик: сколько полных дней прошло без единого промаха
  const streak = useMemo(() => {
    if (sorted.length === 0) return null
    const last = startOfDay(new Date(sorted[0].created_at))
    const today = startOfDay(new Date())
    return Math.round((today.getTime() - last.getTime()) / 86_400_000)
  }, [sorted])

  const byDay = useMemo(() => {
    const groups = new Map<string, PottyEvent[]>()
    for (const ev of sorted) {
      const k = dayKey(new Date(ev.created_at))
      const arr = groups.get(k) ?? []
      arr.push(ev)
      groups.set(k, arr)
    }
    return [...groups.entries()].slice(0, 14)
  }, [sorted])

  const trainerEmoji = (id: string | null) =>
    trainers.find((t) => t.id === id)?.emoji ?? ''

  const doLog = async (type: PottyType) => {
    const ev = await addPotty(type)
    show({
      text: `${POTTY_META[type].emoji} Записали. Сведём к нулю!`,
      actionLabel: 'Отменить',
      onAction: () => void deletePotty(ev.id),
    })
  }

  return (
    <div className="flex flex-col gap-4 p-4 pt-5">
      {/* Стрик */}
      <section className="flex items-center gap-3 overflow-hidden rounded-3xl bg-gradient-to-br from-out-soft to-cream-deep p-4 shadow-sm">
        {streak === null || streak > 0 ? (
          <DranikHappy className="w-28 shrink-0" />
        ) : (
          <DranikSitting className="w-28 shrink-0" />
        )}
        <div className="flex-1">
          {streak === null ? (
            <>
              <p className="text-2xl font-black leading-tight">Ни одного промаха!</p>
              <p className="mt-1 text-sm font-bold text-ink-soft">
                Драник — молодец. Так держать! 🎉
              </p>
            </>
          ) : streak > 0 ? (
            <>
              <p className="text-4xl font-black leading-none">{streak}</p>
              <p className="text-lg font-extrabold leading-tight">
                {pluralize(streak, 'день', 'дня', 'дней')} без промахов
              </p>
              <p className="mt-1 text-sm font-bold text-ink-soft">Продолжаем в том же духе! 🐾</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-black leading-tight">Сегодня был промах 😿</p>
              <p className="mt-1 text-sm font-bold text-ink-soft">
                Ничего, завтра начнём стрик заново!
              </p>
            </>
          )}
        </div>
      </section>

      {/* Быстрая отметка */}
      <section>
        <h2 className="mb-2 px-1 text-sm font-extrabold text-ink-soft">
          Отметить промах
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          {(Object.keys(POTTY_META) as PottyType[]).map((type) => {
            const meta = POTTY_META[type]
            return (
              <button
                key={type}
                onClick={() => void doLog(type)}
                className={`flex h-28 flex-col items-center justify-center gap-1.5 rounded-3xl px-1 text-sm font-extrabold shadow-sm ring-2 transition-transform active:scale-95 ${BTN_STYLES[type]}`}
              >
                <span className="text-3xl">{meta.emoji}</span>
                {meta.label}
              </button>
            )
          })}
        </div>
        <p className="mt-2 px-1 text-xs font-bold text-ink-soft">
          Пелёнка — дома на пелёнку · Мимо — дома мимо пелёнки · Асфальт — на улице не на газон
        </p>
      </section>

      {/* Лента */}
      {byDay.length > 0 && (
        <section className="flex flex-col gap-3">
          {byDay.map(([key, events]) => (
            <div key={key}>
              <h3 className="mb-1.5 px-1 text-sm font-extrabold text-ink-soft">
                {formatDayTitle(new Date(events[0].created_at))}
                <span className="ml-2 rounded-full bg-bad-soft px-2 py-0.5 text-xs text-bad-deep">
                  {events.length}
                </span>
              </h3>
              <div className="flex flex-col gap-1.5">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm"
                  >
                    <span className="text-xl">{POTTY_META[ev.type].emoji}</span>
                    <span className="flex-1">
                      <span className="block text-sm font-extrabold">
                        {POTTY_META[ev.type].label}
                      </span>
                      <span className="block text-xs font-bold text-ink-soft">
                        {formatTime(ev.created_at)}
                        {trainerEmoji(ev.trainer_id) && ` · заметил(а) ${trainerEmoji(ev.trainer_id)}`}
                      </span>
                    </span>
                    <button
                      aria-label="Удалить запись"
                      onClick={() => void deletePotty(ev.id)}
                      className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-cream"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      <Snackbar snack={snack} onHide={hide} />
    </div>
  )
}
