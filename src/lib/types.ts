export type Category = 'fun' | 'useful'
export type TrainLocation = 'home' | 'outside'
export type PottyType = 'pad' | 'miss' | 'asphalt'

export interface Trainer {
  id: string
  name: string
  emoji: string
  color: string
}

export interface Command {
  id: string
  name: string
  emoji: string
  category: Category
  sort_order: number
  is_archived: boolean
  created_at: string
}

export interface TrainingLog {
  id: string
  command_id: string
  trainer_id: string | null
  location: TrainLocation
  created_at: string
}

export interface PottyEvent {
  id: string
  type: PottyType
  trainer_id: string | null
  created_at: string
}

export const CATEGORY_META: Record<Category, { label: string; emoji: string }> = {
  fun: { label: 'Весёлые', emoji: '🎉' },
  useful: { label: 'Полезные', emoji: '🎓' },
}

export const LOCATION_META: Record<TrainLocation, { label: string; emoji: string }> = {
  home: { label: 'Дома', emoji: '🏠' },
  outside: { label: 'На улице', emoji: '🌳' },
}

export const POTTY_META: Record<PottyType, { label: string; emoji: string; hint: string }> = {
  pad: { label: 'На пелёнку', emoji: '🟡', hint: 'дома, но на пелёнку' },
  miss: { label: 'Мимо пелёнки', emoji: '😿', hint: 'дома мимо пелёнки' },
  asphalt: { label: 'На асфальт', emoji: '🚧', hint: 'на улице, но на асфальт' },
}
