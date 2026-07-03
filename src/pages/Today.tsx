import { useMemo, useState } from 'react'
import { useAppData } from '../lib/AppData'
import { startOfDay, formatFullDate, pluralize } from '../lib/dates'
import {
  CATEGORY_META,
  LOCATION_META,
  type Category,
  type Command,
  type TrainLocation,
} from '../lib/types'
import { DranikFace, DranikSitting } from '../components/mascot'
import { Sheet } from '../components/Sheet'
import { Snackbar, useSnackbar } from '../components/Snackbar'
import { CommandForm } from '../components/CommandForm'
import { TrainerSheet } from '../components/TrainerSheet'

type Filter = 'all' | Category

export default function Today() {
  const {
    commands,
    logs,
    currentTrainer,
    logCommand,
    undoLog,
    addCommand,
    updateCommand,
  } = useAppData()

  const [filter, setFilter] = useState<Filter>('all')
  const [logTarget, setLogTarget] = useState<Command | null>(null)
  const [formTarget, setFormTarget] = useState<Command | 'new' | null>(null)
  const [trainerOpen, setTrainerOpen] = useState(false)
  const [burstId, setBurstId] = useState<string | null>(null)
  const [showArchive, setShowArchive] = useState(false)
  const { snack, show, hide } = useSnackbar()

  const todayStart = startOfDay(new Date())
  const todayLogs = useMemo(
    () => logs.filter((l) => new Date(l.created_at) >= todayStart),
    [logs, todayStart],
  )

  const counts = useMemo(() => {
    const m = new Map<string, { total: number; home: number; outside: number }>()
    for (const l of todayLogs) {
      const c = m.get(l.command_id) ?? { total: 0, home: 0, outside: 0 }
      c.total += 1
      c[l.location] += 1
      m.set(l.command_id, c)
    }
    return m
  }, [todayLogs])

  const active = useMemo(
    () =>
      commands
        .filter((c) => !c.is_archived)
        .sort((a, b) => a.sort_order - b.sort_order)
        .filter((c) => filter === 'all' || c.category === filter),
    [commands, filter],
  )
  const archived = useMemo(() => commands.filter((c) => c.is_archived), [commands])

  const doLog = async (command: Command, location: TrainLocation) => {
    setLogTarget(null)
    setBurstId(command.id)
    setTimeout(() => setBurstId(null), 900)
    const log = await logCommand(command.id, location)
    show({
      text: `«${command.name}» ${LOCATION_META[location].emoji} засчитано!`,
      actionLabel: 'Отменить',
      onAction: () => void undoLog(log.id),
    })
  }

  return (
    <div className="flex flex-col gap-4 p-4 pt-5">
      {/* Шапка */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-carrot-soft to-cream-deep p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <DranikFace className="w-20 shrink-0" mood={todayLogs.length > 0 ? 'happy' : 'normal'} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-ink-soft first-letter:uppercase">
              {formatFullDate(new Date())}
            </p>
            <h1 className="text-xl font-black leading-tight">
              {todayLogs.length > 0 ? (
                <>
                  Сегодня: {todayLogs.length}{' '}
                  {pluralize(todayLogs.length, 'команда', 'команды', 'команд')} 🎉
                </>
              ) : (
                'Драник ждёт тренировку!'
              )}
            </h1>
            <button
              onClick={() => setTrainerOpen(true)}
              className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1 text-sm font-bold shadow-sm"
            >
              {currentTrainer?.emoji} {currentTrainer?.name}
              <span className="text-ink-soft">▾</span>
            </button>
          </div>
        </div>
        <span className="pointer-events-none absolute -right-2 -top-3 rotate-12 text-4xl opacity-20">
          🐾
        </span>
      </header>

      {/* Фильтр категорий */}
      <div className="flex gap-2">
        {(
          [
            ['all', 'Все'],
            ['fun', `${CATEGORY_META.fun.emoji} ${CATEGORY_META.fun.label}`],
            ['useful', `${CATEGORY_META.useful.emoji} ${CATEGORY_META.useful.label}`],
          ] as Array<[Filter, string]>
        ).map(([f, label]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`h-10 flex-1 rounded-full text-sm font-extrabold transition-colors ${
              filter === f ? 'bg-ink text-cream shadow-md' : 'bg-card text-ink-soft shadow-sm'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Команды */}
      <div className="flex flex-col gap-2.5">
        {active.map((cmd) => {
          const c = counts.get(cmd.id)
          const catCls = cmd.category === 'fun' ? 'bg-fun-soft' : 'bg-useful-soft'
          return (
            <div key={cmd.id} className="relative">
              <button
                onClick={() => setLogTarget(cmd)}
                className="flex w-full items-center gap-3 rounded-3xl bg-card p-3 pr-4 text-left shadow-sm transition-transform active:scale-[0.98]"
              >
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl ${catCls}`}>
                  {cmd.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg font-extrabold">{cmd.name}</span>
                  <span className="block text-xs font-bold text-ink-soft">
                    {c ? (
                      <>
                        {c.total} {pluralize(c.total, 'раз', 'раза', 'раз')} сегодня
                        {c.home > 0 && ` · 🏠 ${c.home}`}
                        {c.outside > 0 && ` · 🌳 ${c.outside}`}
                      </>
                    ) : (
                      'сегодня ещё не тренировали'
                    )}
                  </span>
                </span>
                {c && (
                  <span className="grid h-7 min-w-7 place-items-center rounded-full bg-out-soft px-1.5 text-sm font-black text-out">
                    {c.total}
                  </span>
                )}
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-carrot text-2xl font-black text-white shadow-md">
                  +
                </span>
              </button>
              <button
                aria-label={`Изменить ${cmd.name}`}
                onClick={() => setFormTarget(cmd)}
                className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-cream-deep text-xs text-ink-soft shadow-sm"
              >
                ✏️
              </button>
              {burstId === cmd.id && <PawBurst />}
            </div>
          )
        })}

        {active.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <DranikSitting className="w-36" />
            <p className="font-bold text-ink-soft">
              Здесь пока пусто — добавь первую команду!
            </p>
          </div>
        )}

        <button
          onClick={() => setFormTarget('new')}
          className="h-14 rounded-3xl border-2 border-dashed border-carrot/60 font-extrabold text-carrot-deep"
        >
          ＋ Добавить команду
        </button>

        {archived.length > 0 && (
          <div className="mt-1">
            <button
              onClick={() => setShowArchive((v) => !v)}
              className="text-sm font-bold text-ink-soft"
            >
              {showArchive ? '▾' : '▸'} Архив ({archived.length})
            </button>
            {showArchive && (
              <div className="mt-2 flex flex-col gap-2">
                {archived.map((cmd) => (
                  <div
                    key={cmd.id}
                    className="flex items-center gap-3 rounded-2xl bg-card/60 p-3 opacity-80"
                  >
                    <span className="text-xl grayscale">{cmd.emoji}</span>
                    <span className="flex-1 font-bold text-ink-soft">{cmd.name}</span>
                    <button
                      onClick={() => void updateCommand(cmd.id, { is_archived: false })}
                      className="rounded-full bg-cream-deep px-3 py-1.5 text-xs font-extrabold"
                    >
                      Вернуть
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Шторка «где занимались» */}
      <Sheet
        open={logTarget !== null}
        onClose={() => setLogTarget(null)}
        title={logTarget ? `${logTarget.emoji} «${logTarget.name}» — где занимались?` : undefined}
      >
        {logTarget && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                onClick={() => void doLog(logTarget, 'home')}
                className="flex h-28 flex-1 flex-col items-center justify-center gap-1 rounded-3xl bg-home-soft text-lg font-extrabold text-home shadow-sm ring-2 ring-home/30 transition-transform active:scale-95"
              >
                <span className="text-4xl">🏠</span>
                Дома
              </button>
              <button
                onClick={() => void doLog(logTarget, 'outside')}
                className="flex h-28 flex-1 flex-col items-center justify-center gap-1 rounded-3xl bg-out-soft text-lg font-extrabold text-out shadow-sm ring-2 ring-out/30 transition-transform active:scale-95"
              >
                <span className="text-4xl">🌳</span>
                На улице
              </button>
            </div>
            <p className="text-center text-xs font-bold text-ink-soft">
              Тренирует: {currentTrainer?.emoji} {currentTrainer?.name}
            </p>
          </div>
        )}
      </Sheet>

      {/* Форма команды: ключ сбрасывает состояние при смене цели */}
      {formTarget !== null && (
        <CommandForm
          key={formTarget === 'new' ? 'new' : formTarget.id}
          open
          command={formTarget === 'new' ? null : formTarget}
          onClose={() => setFormTarget(null)}
          onSave={(input) => {
            if (formTarget === 'new') {
              void addCommand(input)
            } else {
              void updateCommand(formTarget.id, input)
            }
            setFormTarget(null)
          }}
          onArchive={
            formTarget !== 'new'
              ? () => {
                  void updateCommand((formTarget as Command).id, { is_archived: true })
                  setFormTarget(null)
                  show({ text: 'Команда убрана в архив' })
                }
              : undefined
          }
        />
      )}

      <TrainerSheet open={trainerOpen} onClose={() => setTrainerOpen(false)} />
      <Snackbar snack={snack} onHide={hide} />
    </div>
  )
}

/** Лапки, разлетающиеся при отметке */
function PawBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-end pr-14">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="animate-paw-burst absolute text-2xl"
          style={{
            right: `${44 + i * 26}px`,
            animationDelay: `${i * 90}ms`,
            ['--paw-rot' as string]: `${(i - 1) * 28}deg`,
          }}
        >
          🐾
        </span>
      ))}
    </div>
  )
}
