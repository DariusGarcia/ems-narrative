import type { Narrative, Tag } from '@/lib/types'

export type SessionUser = {
  id: string
  username: string
}

export type NarrativeWriteResponse = {
  narrative: Narrative
  error?: string
}

export type NarrativesResponse = {
  narratives: Narrative[]
  user: SessionUser | null
  error?: string
}

export type TagResponse = {
  tag: Tag
  duplicate?: boolean
  error?: string
}

export type TagsResponse = {
  tags: Tag[]
  error?: string
}

export type ApiError = {
  error?: string
}

export type AuthResponse = {
  user: SessionUser
  error?: string
}

export type NarrativeForm = {
  title: string
  content: string
  tagIds: string[]
  isLocked: boolean
  lockPassword: string
}

export type NarrativeEditForm = {
  title: string
  content: string
  tagIds: string[]
}

export type TemplateView = 'feed' | 'mine'

export type AutoGenerateInput = {
  unit: string
  age: string
  chiefComplaint: string
  origin: string
  destination: string
  gender: string
  originNurseName: string
  destinationNurseName: string
  reasonForTransport: string
  requiresAmbulanceTransport: string
  painScale: string
  codeStatus: string
  aoxStatus: string
  gcs: string
  pmhx: string
  transferMethod: string
  allergies: string
}

export type AutoCallType =
  | 'Psych to ER'
  | 'CAT team'
  | '5150'
  | '5585'
  | 'ER'
  | 'IFT Transfer'
  | 'SNF to ER'
  | 'W6000'

export const AUTO_CALL_TYPE_OPTIONS: AutoCallType[] = [
  '5150',
  '5585',
  'CAT team',
  'ER',
  'IFT Transfer',
  'Psych to ER',
  'SNF to ER',
  'W6000',
]
