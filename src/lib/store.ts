import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Command, PottyEvent, Trainer, TrainingLog } from './types'

/**
 * Слой данных. Две реализации:
 *  - SupabaseStore — общая база, включается когда заданы VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY;
 *  - LocalStore — localStorage, работает без настройки (данные только на этом устройстве).
 */
export interface Store {
  mode: 'local' | 'supabase'
  fetchAll(): Promise<{
    trainers: Trainer[]
    commands: Command[]
    logs: TrainingLog[]
    potty: PottyEvent[]
  }>
  updateTrainer(id: string, patch: Partial<Omit<Trainer, 'id'>>): Promise<void>
  addCommand(cmd: Command): Promise<void>
  updateCommand(id: string, patch: Partial<Omit<Command, 'id'>>): Promise<void>
  addLog(log: TrainingLog): Promise<void>
  deleteLog(id: string): Promise<void>
  addPotty(ev: PottyEvent): Promise<void>
  deletePotty(id: string): Promise<void>
}

export function newId(): string {
  return crypto.randomUUID()
}

export function nowISO(): string {
  return new Date().toISOString()
}

// ---------------------------------------------------------------------------
// Стартовые данные (для локального режима; в Supabase то же самое сеет schema.sql)
// ---------------------------------------------------------------------------

export function seedTrainers(): Trainer[] {
  return [
    { id: newId(), name: 'Лера', emoji: '👩🏻', color: '#e8739e' },
    { id: newId(), name: 'Витя', emoji: '🧑🏻', color: '#5b8fd4' },
  ]
}

export function seedCommands(): Command[] {
  const defs: Array<[string, string, 'fun' | 'useful']> = [
    ['Сидеть', '🪑', 'useful'],
    ['Лежать', '🛋️', 'useful'],
    ['Ко мне', '🏃', 'useful'],
    ['Рядом', '🚶', 'useful'],
    ['Место', '🧺', 'useful'],
    ['Ждать', '⏳', 'useful'],
    ['Лапа', '🤝', 'fun'],
    ['Голос', '📣', 'fun'],
    ['Кружись', '🌀', 'fun'],
    ['Дай пять', '✋', 'fun'],
  ]
  const t = nowISO()
  return defs.map(([name, emoji, category], i) => ({
    id: newId(),
    name,
    emoji,
    category,
    sort_order: i,
    is_archived: false,
    created_at: t,
  }))
}

// ---------------------------------------------------------------------------
// LocalStore
// ---------------------------------------------------------------------------

interface LocalData {
  trainers: Trainer[]
  commands: Command[]
  logs: TrainingLog[]
  potty: PottyEvent[]
}

const LOCAL_KEY = 'dranik:data:v1'

class LocalStore implements Store {
  mode = 'local' as const

  private load(): LocalData {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) {
      try {
        return JSON.parse(raw) as LocalData
      } catch {
        // повреждённые данные — начинаем заново
      }
    }
    const fresh: LocalData = {
      trainers: seedTrainers(),
      commands: seedCommands(),
      logs: [],
      potty: [],
    }
    this.save(fresh)
    return fresh
  }

  private save(data: LocalData) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
  }

  private mutate(fn: (data: LocalData) => void): Promise<void> {
    const data = this.load()
    fn(data)
    this.save(data)
    return Promise.resolve()
  }

  fetchAll() {
    return Promise.resolve(this.load())
  }

  updateTrainer(id: string, patch: Partial<Omit<Trainer, 'id'>>) {
    return this.mutate((d) => {
      d.trainers = d.trainers.map((t) => (t.id === id ? { ...t, ...patch } : t))
    })
  }

  addCommand(cmd: Command) {
    return this.mutate((d) => {
      d.commands.push(cmd)
    })
  }

  updateCommand(id: string, patch: Partial<Omit<Command, 'id'>>) {
    return this.mutate((d) => {
      d.commands = d.commands.map((c) => (c.id === id ? { ...c, ...patch } : c))
    })
  }

  addLog(log: TrainingLog) {
    return this.mutate((d) => {
      d.logs.push(log)
    })
  }

  deleteLog(id: string) {
    return this.mutate((d) => {
      d.logs = d.logs.filter((l) => l.id !== id)
    })
  }

  addPotty(ev: PottyEvent) {
    return this.mutate((d) => {
      d.potty.push(ev)
    })
  }

  deletePotty(id: string) {
    return this.mutate((d) => {
      d.potty = d.potty.filter((p) => p.id !== id)
    })
  }
}

// ---------------------------------------------------------------------------
// SupabaseStore
// ---------------------------------------------------------------------------

class SupabaseStore implements Store {
  mode = 'supabase' as const
  private client: SupabaseClient

  constructor(url: string, anonKey: string) {
    this.client = createClient(url, anonKey)
  }

  private async run(promise: PromiseLike<{ error: { message: string } | null }>) {
    const { error } = await promise
    if (error) throw new Error(error.message)
  }

  /**
   * Читает таблицу целиком, страницами.
   *
   * Supabase (PostgREST) отдаёт максимум 1000 строк за запрос и молча
   * обрезает остальное — без ошибки. Отметок о тренировках со временем
   * становится больше 1000, и самые свежие просто не доезжали до приложения:
   * запись была в базе, а на экране после перезагрузки пропадала.
   *
   * Смещение сдвигаем на фактическое число полученных строк, а не на размер
   * страницы, — тогда всё работает и при другом серверном лимите.
   * Сортировка дополняется `id`, чтобы порядок был однозначным и строки
   * не терялись и не дублировались между страницами.
   */
  private async fetchTable<T>(table: string, orderBy: string): Promise<T[]> {
    const PAGE_SIZE = 1000
    const rows: T[] = []
    for (;;) {
      const { data, error } = await this.client
        .from(table)
        .select('*')
        .order(orderBy)
        .order('id')
        .range(rows.length, rows.length + PAGE_SIZE - 1)
      if (error) throw new Error(error.message)
      const batch = (data ?? []) as T[]
      if (batch.length === 0) return rows
      rows.push(...batch)
    }
  }

  async fetchAll() {
    const [trainers, commands, logs, potty] = await Promise.all([
      this.fetchTable<Trainer>('trainers', 'name'),
      this.fetchTable<Command>('commands', 'sort_order'),
      this.fetchTable<TrainingLog>('training_logs', 'created_at'),
      this.fetchTable<PottyEvent>('potty_events', 'created_at'),
    ])
    return { trainers, commands, logs, potty }
  }

  updateTrainer(id: string, patch: Partial<Omit<Trainer, 'id'>>) {
    return this.run(this.client.from('trainers').update(patch).eq('id', id))
  }

  addCommand(cmd: Command) {
    return this.run(this.client.from('commands').insert(cmd))
  }

  updateCommand(id: string, patch: Partial<Omit<Command, 'id'>>) {
    return this.run(this.client.from('commands').update(patch).eq('id', id))
  }

  addLog(log: TrainingLog) {
    return this.run(this.client.from('training_logs').insert(log))
  }

  deleteLog(id: string) {
    return this.run(this.client.from('training_logs').delete().eq('id', id))
  }

  addPotty(ev: PottyEvent) {
    return this.run(this.client.from('potty_events').insert(ev))
  }

  deletePotty(id: string) {
    return this.run(this.client.from('potty_events').delete().eq('id', id))
  }
}

// ---------------------------------------------------------------------------

export function createStore(): Store {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (url && key) return new SupabaseStore(url, key)
  return new LocalStore()
}
