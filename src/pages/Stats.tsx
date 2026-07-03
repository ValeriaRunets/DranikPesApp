import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAppData } from '../lib/AppData'
import { addDays, dayKey, pluralize, shortDayLabel, startOfDay } from '../lib/dates'
import { POTTY_META, type PottyType } from '../lib/types'
import { DranikSitting } from '../components/mascot'

type Period = 'day' | 'week' | 'month'

/* Цвета для графиков — темнее интерфейсных, проверены validate_palette.js
   (контраст ≥3:1 на кремовом фоне, CVD-разделение пар ≥12) */
const CHART = {
  home: '#4a7ec2',
  out: '#4e8a52',
  activity: '#c77008',
  bad: '#e05b4a',
  ink: '#4a3728',
  inkSoft: '#a08b78',
  grid: '#f0e4d2',
  surface: '#fdf7ee',
}
const TRAINER_CHART_COLORS = ['#d1517e', '#4a7ec2', '#c77008', '#4e8a52']

const PERIODS: Array<[Period, string]> = [
  ['day', 'День'],
  ['week', 'Неделя'],
  ['month', 'Месяц'],
]

export default function Stats() {
  const { commands, logs, potty, trainers } = useAppData()
  const [period, setPeriod] = useState<Period>('week')

  const now = new Date()
  const rangeStart = useMemo(() => {
    const today = startOfDay(now)
    if (period === 'day') return today
    if (period === 'week') return addDays(today, -6)
    return addDays(today, -29)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const logsIn = useMemo(
    () => logs.filter((l) => new Date(l.created_at) >= rangeStart),
    [logs, rangeStart],
  )
  const pottyIn = useMemo(
    () => potty.filter((p) => new Date(p.created_at) >= rangeStart),
    [potty, rangeStart],
  )

  // По командам: сколько раз тренировали (в т.ч. 0 — видно заброшенные)
  const perCommand = useMemo(() => {
    const rows = commands
      .filter((c) => !c.is_archived)
      .map((c) => {
        const own = logsIn.filter((l) => l.command_id === c.id)
        return {
          name: `${c.emoji} ${c.name}`,
          home: own.filter((l) => l.location === 'home').length,
          outside: own.filter((l) => l.location === 'outside').length,
          total: own.length,
        }
      })
    return rows.sort((a, b) => b.total - a.total)
  }, [commands, logsIn])

  // Активность по времени: день — по часам, неделя/месяц — по дням
  const activity = useMemo(() => {
    if (period === 'day') {
      const byHour = new Array(24).fill(0)
      for (const l of logsIn) byHour[new Date(l.created_at).getHours()] += 1
      return byHour.map((count, h) => ({ label: String(h), count }))
    }
    const days = period === 'week' ? 7 : 30
    const buckets: Array<{ label: string; key: string; count: number }> = []
    for (let i = days - 1; i >= 0; i--) {
      const d = addDays(startOfDay(now), -i)
      buckets.push({ label: shortDayLabel(d), key: dayKey(d), count: 0 })
    }
    const idx = new Map(buckets.map((b, i) => [b.key, i]))
    for (const l of logsIn) {
      const i = idx.get(dayKey(new Date(l.created_at)))
      if (i !== undefined) buckets[i].count += 1
    }
    return buckets
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logsIn, period])

  const perTrainer = useMemo(
    () =>
      trainers.map((t, i) => ({
        name: `${t.emoji} ${t.name}`,
        count: logsIn.filter((l) => l.trainer_id === t.id).length,
        fill: TRAINER_CHART_COLORS[i % TRAINER_CHART_COLORS.length],
      })),
    [trainers, logsIn],
  )

  // Туалет: тренд по дням (для дня — раскладка по типам)
  const pottyTrend = useMemo(() => {
    if (period === 'day') return null
    const days = period === 'week' ? 7 : 30
    const buckets: Array<{ label: string; key: string; count: number }> = []
    for (let i = days - 1; i >= 0; i--) {
      const d = addDays(startOfDay(now), -i)
      buckets.push({ label: shortDayLabel(d), key: dayKey(d), count: 0 })
    }
    const idx = new Map(buckets.map((b, i) => [b.key, i]))
    for (const p of pottyIn) {
      const i = idx.get(dayKey(new Date(p.created_at)))
      if (i !== undefined) buckets[i].count += 1
    }
    return buckets
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pottyIn, period])

  const homeTotal = logsIn.filter((l) => l.location === 'home').length
  const outTotal = logsIn.length - homeTotal

  return (
    <div className="flex flex-col gap-4 p-4 pt-5">
      <h1 className="px-1 text-2xl font-black">Статистика</h1>

      {/* Период */}
      <div className="flex rounded-full bg-card p-1 shadow-sm">
        {PERIODS.map(([p, label]) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`h-10 flex-1 rounded-full text-sm font-extrabold transition-colors ${
              period === p ? 'bg-ink text-cream shadow' : 'text-ink-soft'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Сводка */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatTile value={logsIn.length} label="выполнений" emoji="🦴" />
        <StatTile
          value={`${homeTotal}/${outTotal}`}
          label="дома / улица"
          emoji="🏠🌳"
          small
        />
        <StatTile
          value={pottyIn.length}
          label={pluralize(pottyIn.length, 'промах', 'промаха', 'промахов')}
          emoji="💧"
          accent={pottyIn.length > 0 ? 'bad' : 'good'}
        />
      </div>

      {logsIn.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl bg-card p-6 text-center shadow-sm">
          <DranikSitting className="w-36" />
          <p className="font-bold text-ink-soft">
            За этот период тренировок пока не было. Драник готов начать! 🐾
          </p>
        </div>
      ) : (
        <>
          {/* По командам */}
          <ChartCard
            title="По командам"
            subtitle="каких команд много, а какие заброшены"
            legend={[
              { label: '🏠 Дома', color: CHART.home },
              { label: '🌳 На улице', color: CHART.out },
            ]}
          >
            <ResponsiveContainer width="100%" height={perCommand.length * 38 + 16}>
              <BarChart
                data={perCommand}
                layout="vertical"
                margin={{ top: 0, right: 34, bottom: 0, left: 0 }}
                barSize={16}
              >
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={102}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: CHART.ink, fontSize: 12, fontWeight: 700 }}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f5ead866' }} />
                {/* метку «всего» рисует тот сегмент, который оказался концом бара:
                    Recharts не вызывает label у сегментов нулевой ширины */}
                <Bar dataKey="home" name="🏠 Дома" stackId="loc" fill={CHART.home}
                  stroke={CHART.surface} strokeWidth={1}>
                  {/* стандартный LabelList пропускает сегменты нулевой ширины,
                      поэтому случай «только дома» подписывает домашний сегмент */}
                  <LabelList
                    dataKey="home"
                    content={makeHomeOnlyLabel(perCommand)}
                  />
                </Bar>
                <Bar dataKey="outside" name="🌳 На улице" stackId="loc" fill={CHART.out}
                  stroke={CHART.surface} strokeWidth={1} radius={[0, 4, 4, 0]}>
                  <LabelList
                    dataKey="total"
                    position="right"
                    style={{ fill: CHART.ink, fontSize: 12, fontWeight: 800 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Активность */}
          <ChartCard
            title="Активность"
            subtitle={
              period === 'day' ? 'выполнений по часам' : 'выполнений по дням'
            }
          >
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={activity} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  interval={period === 'month' ? 4 : period === 'day' ? 3 : 0}
                  tick={{ fill: CHART.inkSoft, fontSize: 11, fontWeight: 700 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: CHART.inkSoft, fontSize: 11, fontWeight: 700 }}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f5ead866' }} />
                <Bar
                  dataKey="count"
                  name="Выполнений"
                  fill={CHART.activity}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Кто тренирует */}
          <ChartCard title="Кто тренирует Драника" subtitle="выполнений за период">
            <ResponsiveContainer width="100%" height={perTrainer.length * 44 + 8}>
              <BarChart
                data={perTrainer}
                layout="vertical"
                margin={{ top: 0, right: 34, bottom: 0, left: 0 }}
                barSize={18}
              >
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={102}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: CHART.ink, fontSize: 12, fontWeight: 700 }}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f5ead866' }} />
                <Bar dataKey="count" name="Выполнений" radius={[0, 4, 4, 0]}>
                  {perTrainer.map((t) => (
                    <Cell key={t.name} fill={t.fill} />
                  ))}
                  <LabelList dataKey="count" content={BarValueLabel} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}

      {/* Туалет */}
      <ChartCard
        title="Туалетные промахи"
        subtitle={period === 'day' ? 'за сегодня' : 'цель — ноль каждый день'}
      >
        {period === 'day' || !pottyTrend ? (
          <div className="grid grid-cols-3 gap-2.5">
            {(Object.keys(POTTY_META) as PottyType[]).map((t) => {
              const count = pottyIn.filter((p) => p.type === t).length
              return (
                <div
                  key={t}
                  className={`flex flex-col items-center rounded-2xl p-3 ${
                    count > 0 ? 'bg-bad-soft' : 'bg-out-soft'
                  }`}
                >
                  <span className="text-xl">{POTTY_META[t].emoji}</span>
                  <span className="text-2xl font-black">{count}</span>
                  <span className="text-center text-[11px] font-bold leading-tight text-ink-soft">
                    {POTTY_META[t].label}
                  </span>
                </div>
              )
            })}
          </div>
        ) : pottyIn.length === 0 ? (
          <p className="py-2 text-center font-bold text-out">
            Ни одного промаха за период — Драник молодец! 🎉
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={pottyTrend} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
              <CartesianGrid vertical={false} stroke={CHART.grid} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                interval={period === 'month' ? 4 : 0}
                tick={{ fill: CHART.inkSoft, fontSize: 11, fontWeight: 700 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: CHART.inkSoft, fontSize: 11, fontWeight: 700 }}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f5ead866' }} />
              <Bar
                dataKey="count"
                name="Промахов"
                fill={CHART.bad}
                radius={[4, 4, 0, 0]}
                maxBarSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  )
}

interface BarLabelProps {
  x?: number | string
  y?: number | string
  width?: number | string
  height?: number | string
  value?: number | string
  index?: number
}

function BarEndText({ p, text }: { p: BarLabelProps; text: number | string }) {
  return (
    <text
      x={Number(p.x ?? 0) + Number(p.width ?? 0) + 6}
      y={Number(p.y ?? 0) + Number(p.height ?? 0) / 2}
      dominantBaseline="central"
      fontSize={12}
      fontWeight={800}
      fill={CHART.ink}
    >
      {text}
    </text>
  )
}

/** Метка «всего» для строк, где тренировали только дома: уличный сегмент
    нулевой ширины не рендерит свой LabelList, подписываем домашним */
function makeHomeOnlyLabel(rows: Array<{ home: number; outside: number; total: number }>) {
  return function HomeOnlyLabel(props: unknown) {
    const p = props as BarLabelProps
    const row = p.index === undefined ? undefined : rows[p.index]
    if (!row || row.outside > 0 || row.home === 0) return null
    return <BarEndText p={p} text={row.total} />
  }
}

/** Метка значения у конца обычного горизонтального бара (нули не подписываем) */
function BarValueLabel(props: unknown) {
  const p = props as BarLabelProps
  const n = Number(p.value)
  if (!n) return null
  return <BarEndText p={p} text={n} />
}

function StatTile({
  value,
  label,
  emoji,
  accent,
  small,
}: {
  value: number | string
  label: string
  emoji: string
  accent?: 'bad' | 'good'
  small?: boolean
}) {
  const accentCls =
    accent === 'bad' ? 'text-bad-deep' : accent === 'good' ? 'text-out' : 'text-ink'
  return (
    <div className="flex flex-col items-center rounded-3xl bg-card p-3 shadow-sm">
      <span className="text-sm">{emoji}</span>
      <span className={`font-black ${small ? 'text-xl' : 'text-2xl'} ${accentCls}`}>
        {value}
      </span>
      <span className="text-center text-[11px] font-bold leading-tight text-ink-soft">
        {label}
      </span>
    </div>
  )
}

function ChartCard({
  title,
  subtitle,
  legend,
  children,
}: {
  title: string
  subtitle?: string
  legend?: Array<{ label: string; color: string }>
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl bg-card p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div>
          <h2 className="text-base font-extrabold">{title}</h2>
          {subtitle && <p className="text-xs font-bold text-ink-soft">{subtitle}</p>}
        </div>
        {legend && (
          <div className="flex gap-3">
            {legend.map((l) => (
              <span key={l.label} className="flex items-center gap-1.5 text-xs font-bold">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: l.color }}
                />
                {l.label}
              </span>
            ))}
          </div>
        )}
      </div>
      {children}
    </section>
  )
}

interface TooltipPayload {
  name?: string
  value?: number | string
  color?: string
  fill?: string
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string | number
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-xl bg-card px-3 py-2 text-xs font-bold shadow-lg ring-1 ring-line">
      {label !== undefined && <div className="mb-1 text-ink-soft">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: p.color ?? p.fill }}
          />
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  )
}
