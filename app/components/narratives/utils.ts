import type { Narrative, Tag } from '@/lib/types'
import type {
  AutoGenerateInput,
  NarrativeEditForm,
  NarrativeForm,
} from '@/app/components/narratives/types'

export function makeEmptyForm(): NarrativeForm {
  return {
    title: '',
    content: '',
    tagIds: [],
    isLocked: false,
    lockPassword: '',
  }
}

export function makeEditFormFromNarrative(
  narrative: Narrative,
): NarrativeEditForm {
  return {
    title: narrative.title,
    content: narrative.content,
    tagIds: narrative.tags.map((tag) => tag.id),
  }
}

export function sortNarrativesByUpdatedAt(
  narratives: Narrative[],
): Narrative[] {
  return [...narratives].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  )
}

export function sortTagsByName(tags: Tag[]): Tag[] {
  return [...tags].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  )
}

export async function readJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T
  } catch {
    return {} as T
  }
}

const PSYCH_TEMPLATE = `Unit [unit] AOS at [origin] to find a [age] y/o [gender]. Chief complaint of [CC]. Report, transfer packet received from [origin clinician role] [nurse]. PT found in room/location [location]. Patient is being transported to [destination] for [reason]. Requires ambulance transport due to [medical necessity].

AxOx[aox], GCS [gcs]. Vitals on scene: WNL for BLS transport. Pain [pain]/10. Isolation status: [isolation precautions]. Medical devices: none. PMHx of [pmhx]. Allergies: [allergies].

Patient transferred to the gurney via [transfer method] EMTx2 without incident. Placed in semifowlers to maintain airway patency. [restraint block]Vitals monitored en route and remained stable.

Patient transported to [destination]. Upon arrival, patient was transferred to bed via [transfer method] EMTx2 without incident. Report, transfer packet, and patient's belongings were handed off to RN [handoff nurse]. Gurney and equipment were decontaminated and prepared for the next call.

All times approximate.`

const PSYCH_RESTRAINT_BLOCK =
  'Restraints applied due to psych hold. PMSCs were assessed immediately before applying restraints, within five minutes after application, and every 15 during transport, remaining intact throughout. A final PMSC check was performed immediately after removing the restraints. '

const ER_IFT_TEMPLATE = `Unit [unit] AOS at [origin] to find a [age] y/o [gender] admitted for [CC]. Patient found in semifowlers in [location]. Report received from RN [nurse]. Patient is being transported to [destination] for [reason].

Patient transported by ambulance due to [medical necessity]. AxOx[aox], GCS [gcs]. Isolation status: [isolation precautions]. Code status: [code status]. PMHx of [pmhx]. Allergies: [allergies].

Upon initial patient contact, patient was assessed and initial vitals obtained. Chief complaint of [CC]. Pain [pain]/10. Vitals monitored and remained stable for BLS transport.

Patient transferred to the gurney via [transfer method] EMTx2 without incident. Patient placed in semifowlers with side rails up and safety straps secured. All vitals remained stable during transport.

No medications administered during transport.

Patient loaded into ambulance without incident. Patient closely monitored en route and arrived at destination with no significant change in status.

Upon arrival at [destination], patient transferred from gurney to [destination location] via [transfer method] EMTx2 without incident and placed in semifowlers. Patient care transferred to RN [handoff nurse]. Gurney and equipment were decontaminated and prepared for the next call.

All times approximate.`

function replaceTemplateFields(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\[([^\]]+)\]/g, (fullMatch, key) => {
    const normalizedKey = String(key).trim().toLowerCase()
    if (Object.hasOwn(values, normalizedKey)) {
      return values[normalizedKey]
    }
    return fullMatch
  })
}

function normalizePainScale(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  const match = trimmed.match(/^(\d{1,2})(?:\s*\/\s*10)?$/)
  if (!match) {
    return trimmed
  }

  return match[1]
}

export function buildNarrativeFromCallType(
  selectedCallTypes: string[],
  input: AutoGenerateInput,
): { narrative?: string; title?: string; error?: string } {
  const normalizedCallTypes = selectedCallTypes.map((value) =>
    value.toLowerCase(),
  )
  const psychGroup = new Set([
    'psych to er',
    'cat team',
    'cat to er',
    'cat call',
    '5150',
    '5585',
    'w6000',
  ])
  const medicalGroup = new Set([
    'er',
    'ift transfer',
    'snf to er',
    'bls going to er',
    'er discharge',
  ])

  const includesPsychFamily = normalizedCallTypes.some((value) =>
    psychGroup.has(value),
  )
  const usesCatOriginRole = normalizedCallTypes.some((value) =>
    ['psych to er', '5150', '5585'].includes(value),
  )
  const includesW6000 = normalizedCallTypes.includes('w6000')
  const includesMedicalFamily = normalizedCallTypes.some((value) =>
    medicalGroup.has(value),
  )

  if (!includesPsychFamily && !includesMedicalFamily) {
    return {
      error: 'Select at least one call type to auto-generate a narrative.',
    }
  }

  const selectedTemplate = includesPsychFamily
    ? PSYCH_TEMPLATE
    : ER_IFT_TEMPLATE
  const title = includesPsychFamily
    ? 'Psych/CAT/5150 Transport'
    : 'ER/IFT/SNF Transfer'

  const narrative = replaceTemplateFields(selectedTemplate, {
    unit: input.unit.trim(),
    age: input.age.trim(),
    cc: input.chiefComplaint.trim(),
    origin: input.origin.trim(),
    location: input.roomLocationFoundIn.trim(),
    'destination location': input.destinationRoomDropOffLocation.trim(),
    destination: input.destination.trim(),
    gender: input.gender.trim(),
    nurse: input.originNurseName.trim(),
    'origin clinician role': usesCatOriginRole ? 'BHC I' : 'RN',
    'handoff nurse': input.destinationNurseName.trim(),
    reason: input.reasonForTransport.trim(),
    'medical necessity': input.requiresAmbulanceTransport.trim(),
    'isolation precautions': input.isolationPrecasutions.trim(),
    'restraint block': includesW6000 ? '' : PSYCH_RESTRAINT_BLOCK,
    pain: normalizePainScale(input.painScale),
    'code status': input.codeStatus.trim(),
    aox: input.aoxStatus.trim(),
    gcs: input.gcs.trim(),
    pmhx: input.pmhx.trim(),
    'transfer method': input.transferMethod.trim(),
    allergies: input.allergies.trim(),
  })

  return { narrative, title }
}
