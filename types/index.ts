export type SkillLevel =
  | 'yeu'
  | 'yeu_plus'
  | 'yeu_minus'
  | 'tby'
  | 'tby_plus'
  | 'tby_minus'
  | 'tb'
  | 'tb_plus'
  | 'tb_minus'
  | 'kha'
  | 'kha_plus'
  | 'kha_minus'
  | 'gioi'
  | 'gioi_plus'
  | 'gioi_minus'

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  yeu: 'Yếu',
  yeu_plus: 'Yếu +',
  yeu_minus: 'Yếu -',
  tby: 'TBY',
  tby_plus: 'TBY +',
  tby_minus: 'TBY -',
  tb: 'TB',
  tb_plus: 'TB +',
  tb_minus: 'TB -',
  kha: 'Khá',
  kha_plus: 'Khá +',
  kha_minus: 'Khá -',
  gioi: 'Giỏi',
  gioi_plus: 'Giỏi +',
  gioi_minus: 'Giỏi -',
}

export const SKILL_LEVELS: SkillLevel[] = [
  'yeu_minus', 'yeu', 'yeu_plus',
  'tby_minus', 'tby', 'tby_plus',
  'tb_minus', 'tb', 'tb_plus',
  'kha_minus', 'kha', 'kha_plus',
  'gioi_minus', 'gioi', 'gioi_plus',
]

export type EventStatus = 'active' | 'closed' | 'completed' | 'cancelled'
export type BookingStatus = 'booked' | 'cancelled' | 'completed'

export interface User {
  id: string
  email: string
  phone: string | null
  display_name: string
  avatar_url: string | null
  bio: string | null
  skill_level: SkillLevel | null
  created_at: string
  updated_at: string
}

export interface Court {
  id: string
  owner_id: string
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
}

export interface Event {
  id: string
  host_id: string
  title: string
  description: string | null
  location: string
  latitude: number | null
  longitude: number | null
  event_date: string
  event_time: string
  event_end_time: string | null
  event_end_date: string | null
  status: EventStatus
  token_cost: number
  price_min: number | null
  price_max: number | null
  split_evenly: boolean
  created_at: string
  updated_at: string
  host?: User
  skill_requirements?: EventSkillRequirement[]
}

export interface FilterState {
  searchQuery: string
  skillLevel?: SkillLevel
  dateStart?: string
  dateEnd?: string
  maxDistance?: number
  sortBy: 'distance' | 'date' | 'slots'
}

export interface EventSkillRequirement {
  id: string
  event_id: string
  skill_level: SkillLevel
  slots_needed: number
  slots_booked: number
}

export interface Booking {
  id: string
  event_id: string
  member_id: string
  skill_level: SkillLevel
  status: BookingStatus
  booked_at: string
  member?: User
  event?: Event
}

export interface Team {
  id: string
  event_id: string
  team_name: string
  members: string[]
  created_at: string
}
