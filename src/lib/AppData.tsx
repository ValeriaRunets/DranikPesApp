/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createStore, newId, nowISO } from './store'
import type {
  Category,
  Command,
  PottyEvent,
  PottyType,
  Trainer,
  TrainLocation,
  TrainingLog,
} from './types'

const TRAINER_KEY = 'dranik:trainer'

interface AppData {
  loading: boolean
  error: string | null
  mode: 'local' | 'supabase'
  trainers: Trainer[]
  commands: Command[]
  logs: TrainingLog[]
  potty: PottyEvent[]
  currentTrainer: Trainer | null
  setCurrentTrainer: (id: string) => void
  updateTrainer: (id: string, patch: Partial<Omit<Trainer, 'id'>>) => Promise<void>
  logCommand: (commandId: string, location: TrainLocation) => Promise<TrainingLog>
  undoLog: (id: string) => Promise<void>
  addCommand: (input: { name: string; emoji: string; category: Category }) => Promise<void>
  updateCommand: (id: string, patch: Partial<Omit<Command, 'id'>>) => Promise<void>
  addPotty: (type: PottyType) => Promise<PottyEvent>
  deletePotty: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

const Ctx = createContext<AppData | null>(null)

export function useAppData(): AppData {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAppData вне AppDataProvider')
  return v
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef(createStore())
  const store = storeRef.current

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [commands, setCommands] = useState<Command[]>([])
  const [logs, setLogs] = useState<TrainingLog[]>([])
  const [potty, setPotty] = useState<PottyEvent[]>([])
  const [currentTrainerId, setCurrentTrainerId] = useState<string | null>(
    () => localStorage.getItem(TRAINER_KEY),
  )

  const refresh = useCallback(async () => {
    try {
      const data = await store.fetchAll()
      setTrainers(data.trainers)
      setCommands(data.commands)
      setLogs(data.logs)
      setPotty(data.potty)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [store])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Подтягиваем чужие отметки, когда возвращаешься в приложение
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [refresh])

  const persist = useCallback(
    async (op: Promise<void>) => {
      try {
        await op
      } catch (e) {
        // откатываемся к состоянию базы, чтобы UI не разошёлся с ней
        setError(e instanceof Error ? e.message : String(e))
        await refresh()
        throw e
      }
    },
    [refresh],
  )

  const setCurrentTrainer = useCallback((id: string) => {
    localStorage.setItem(TRAINER_KEY, id)
    setCurrentTrainerId(id)
  }, [])

  const updateTrainer = useCallback(
    async (id: string, patch: Partial<Omit<Trainer, 'id'>>) => {
      setTrainers((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
      await persist(store.updateTrainer(id, patch))
    },
    [persist, store],
  )

  const logCommand = useCallback(
    async (commandId: string, location: TrainLocation) => {
      const log: TrainingLog = {
        id: newId(),
        command_id: commandId,
        trainer_id: currentTrainerId,
        location,
        created_at: nowISO(),
      }
      setLogs((prev) => [...prev, log])
      await persist(store.addLog(log))
      return log
    },
    [currentTrainerId, persist, store],
  )

  const undoLog = useCallback(
    async (id: string) => {
      setLogs((prev) => prev.filter((l) => l.id !== id))
      await persist(store.deleteLog(id))
    },
    [persist, store],
  )

  const addCommand = useCallback(
    async (input: { name: string; emoji: string; category: Category }) => {
      const cmd: Command = {
        id: newId(),
        name: input.name,
        emoji: input.emoji,
        category: input.category,
        sort_order: commands.length,
        is_archived: false,
        created_at: nowISO(),
      }
      setCommands((prev) => [...prev, cmd])
      await persist(store.addCommand(cmd))
    },
    [commands.length, persist, store],
  )

  const updateCommand = useCallback(
    async (id: string, patch: Partial<Omit<Command, 'id'>>) => {
      setCommands((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
      await persist(store.updateCommand(id, patch))
    },
    [persist, store],
  )

  const addPotty = useCallback(
    async (type: PottyType) => {
      const ev: PottyEvent = {
        id: newId(),
        type,
        trainer_id: currentTrainerId,
        created_at: nowISO(),
      }
      setPotty((prev) => [...prev, ev])
      await persist(store.addPotty(ev))
      return ev
    },
    [currentTrainerId, persist, store],
  )

  const deletePotty = useCallback(
    async (id: string) => {
      setPotty((prev) => prev.filter((p) => p.id !== id))
      await persist(store.deletePotty(id))
    },
    [persist, store],
  )

  const currentTrainer = useMemo(
    () => trainers.find((t) => t.id === currentTrainerId) ?? null,
    [trainers, currentTrainerId],
  )

  const value: AppData = {
    loading,
    error,
    mode: store.mode,
    trainers,
    commands,
    logs,
    potty,
    currentTrainer,
    setCurrentTrainer,
    updateTrainer,
    logCommand,
    undoLog,
    addCommand,
    updateCommand,
    addPotty,
    deletePotty,
    refresh,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
