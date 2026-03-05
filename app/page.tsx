'use client'

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { Narrative, Tag } from '@/lib/types'

type NarrativeWriteResponse = {
  narrative: Narrative
  error?: string
}

type NarrativesResponse = {
  narratives: Narrative[]
  user: SessionUser | null
  error?: string
}

type TagResponse = {
  tag: Tag
  duplicate?: boolean
  error?: string
}

type TagsResponse = {
  tags: Tag[]
  error?: string
}

type ApiError = {
  error?: string
}

type SessionUser = {
  id: string
  username: string
}

type AuthResponse = {
  user: SessionUser
  error?: string
}

type NarrativeForm = {
  title: string
  content: string
  tagIds: string[]
  isLocked: boolean
  lockPassword: string
}

type NarrativeEditForm = {
  title: string
  content: string
  tagIds: string[]
}

function makeEmptyForm(): NarrativeForm {
  return {
    title: '',
    content: '',
    tagIds: [],
    isLocked: false,
    lockPassword: '',
  }
}

function makeEditFormFromNarrative(narrative: Narrative): NarrativeEditForm {
  return {
    title: narrative.title,
    content: narrative.content,
    tagIds: narrative.tags.map((tag) => tag.id),
  }
}

function sortNarrativesByUpdatedAt(narratives: Narrative[]): Narrative[] {
  return [...narratives].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  )
}

function sortTagsByName(tags: Tag[]): Tag[] {
  return [...tags].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  )
}

async function readJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T
  } catch {
    return {} as T
  }
}

export default function Home() {
  const [narratives, setNarratives] = useState<Narrative[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedFilterTagIds, setSelectedFilterTagIds] = useState<string[]>([])
  const [editingCardNarrativeId, setEditingCardNarrativeId] = useState<
    string | null
  >(null)
  const [editingCardForm, setEditingCardForm] =
    useState<NarrativeEditForm | null>(null)
  const [newTagName, setNewTagName] = useState('')
  const [form, setForm] = useState<NarrativeForm>(makeEmptyForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingNarrative, setIsSavingNarrative] = useState(false)
  const [isSavingTag, setIsSavingTag] = useState(false)
  const [isSavingCardNarrative, setIsSavingCardNarrative] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)
  const [templateView, setTemplateView] = useState<'feed' | 'mine'>('feed')
  const [createTarget, setCreateTarget] = useState<'feed' | 'mine'>('feed')
  const [authUsername, setAuthUsername] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null)
  const [unlockedPasswords, setUnlockedPasswords] = useState<
    Record<string, string>
  >({})
  const [copiedNarrativeId, setCopiedNarrativeId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const scope = templateView === 'mine' ? 'mine' : 'feed'
      const [tagsResponse, narrativesResponse] = await Promise.all([
        fetch('/api/tags', { cache: 'no-store' }),
        fetch(`/api/narratives?scope=${scope}`, { cache: 'no-store' }),
      ])

      const tagsPayload = await readJson<TagsResponse>(tagsResponse)
      const narrativesPayload =
        await readJson<NarrativesResponse>(narrativesResponse)

      if (!tagsResponse.ok) {
        throw new Error(tagsPayload.error ?? 'Could not load tags.')
      }

      if (!narrativesResponse.ok) {
        throw new Error(
          narrativesPayload.error ?? 'Could not load narrative templates.',
        )
      }

      setTags(sortTagsByName(tagsPayload.tags ?? []))
      setNarratives(
        sortNarrativesByUpdatedAt(narrativesPayload.narratives ?? []),
      )
      setSessionUser(narrativesPayload.user ?? null)
      if (!narrativesPayload.user) {
        setTemplateView('feed')
        setCreateTarget('feed')
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not load your narrative library.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [templateView])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (window.matchMedia('(max-width: 1024px)').matches) {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [])

  useEffect(() => {
    if (!copiedNarrativeId) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setCopiedNarrativeId((current) =>
        current === copiedNarrativeId ? null : current,
      )
    }, 2500)

    return () => window.clearTimeout(timeoutId)
  }, [copiedNarrativeId])

  useEffect(() => {
    if (!statusMessage) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setStatusMessage((current) => (current === statusMessage ? null : current))
    }, 2500)

    return () => window.clearTimeout(timeoutId)
  }, [statusMessage])

  const filteredNarratives = useMemo(() => {
    if (selectedFilterTagIds.length === 0) {
      return narratives
    }

    return narratives.filter((narrative) => {
      const narrativeTagIds = new Set(narrative.tags.map((tag) => tag.id))
      return selectedFilterTagIds.every((tagId) => narrativeTagIds.has(tagId))
    })
  }, [narratives, selectedFilterTagIds])

  const tagUsageCount = useMemo(() => {
    const counts: Record<string, number> = {}

    for (const narrative of narratives) {
      for (const tag of narrative.tags) {
        counts[tag.id] = (counts[tag.id] ?? 0) + 1
      }
    }

    return counts
  }, [narratives])

  function resetFormForNewNarrative() {
    setForm(makeEmptyForm())
    setEditingCardNarrativeId(null)
    setEditingCardForm(null)
    setStatusMessage(null)
    setErrorMessage(null)
  }

  async function ensureUnlockedForAction(
    narrative: Narrative,
    action: 'edit' | 'delete',
  ): Promise<string | null> {
    if (!narrative.is_locked) {
      return ''
    }

    const cachedPassword = unlockedPasswords[narrative.id]
    if (cachedPassword) {
      return cachedPassword
    }

    const password = window.prompt(
      `This template is locked. Enter password to ${action} "${narrative.title}".`,
    )

    if (!password) {
      return null
    }

    const unlockResponse = await fetch(`/api/narratives/${narrative.id}/unlock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    })

    const unlockPayload = await readJson<ApiError>(unlockResponse)

    if (!unlockResponse.ok) {
      setErrorMessage(unlockPayload.error ?? 'Incorrect password for locked template.')
      return null
    }

    setUnlockedPasswords((current) => ({
      ...current,
      [narrative.id]: password,
    }))

    if (action === 'edit') {
      setStatusMessage('Template unlocked for editing.')
    }

    return password
  }

  async function beginEditingNarrative(narrative: Narrative) {
    const unlockPassword = await ensureUnlockedForAction(narrative, 'edit')

    if (unlockPassword === null) {
      return
    }

    setEditingCardNarrativeId(narrative.id)
    setEditingCardForm(makeEditFormFromNarrative(narrative))
    setErrorMessage(null)
  }

  function toggleNarrativeTag(tagId: string) {
    setForm((currentForm) => {
      if (currentForm.tagIds.includes(tagId)) {
        return {
          ...currentForm,
          tagIds: currentForm.tagIds.filter((id) => id !== tagId),
        }
      }

      return {
        ...currentForm,
        tagIds: [...currentForm.tagIds, tagId],
      }
    })
  }

  function toggleEditingCardTag(tagId: string) {
    setEditingCardForm((currentForm) => {
      if (!currentForm) {
        return currentForm
      }

      if (currentForm.tagIds.includes(tagId)) {
        return {
          ...currentForm,
          tagIds: currentForm.tagIds.filter((id) => id !== tagId),
        }
      }

      return {
        ...currentForm,
        tagIds: [...currentForm.tagIds, tagId],
      }
    })
  }

  async function handleNarrativeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage(null)
    setErrorMessage(null)

    const title = form.title.trim()
    const content = form.content.trim()

    if (!title || !content) {
      setErrorMessage('Title and narrative text are both required.')
      return
    }

    if (form.isLocked && form.lockPassword.trim().length < 4) {
      setErrorMessage('Lock password must be at least 4 characters.')
      return
    }

    setIsSavingNarrative(true)

    try {
      const response = await fetch('/api/narratives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          tagIds: form.tagIds,
          isLocked: form.isLocked,
          lockPassword: form.lockPassword,
          templateScope: createTarget,
        }),
      })

      const payload = await readJson<NarrativeWriteResponse | ApiError>(
        response,
      )

      if (!response.ok || !('narrative' in payload)) {
        throw new Error(
          payload.error ?? 'Could not save this narrative template.',
        )
      }

      const savedNarrative = payload.narrative

      setNarratives((currentNarratives) =>
        sortNarrativesByUpdatedAt([
          savedNarrative,
          ...currentNarratives.filter(
            (narrative) => narrative.id !== savedNarrative.id,
          ),
        ]),
      )
      setForm(makeEmptyForm())
      setStatusMessage('Narrative template created.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not save this narrative template.',
      )
    } finally {
      setIsSavingNarrative(false)
    }
  }

  async function handleInlineNarrativeSave(narrativeId: string) {
    if (!editingCardForm) {
      return
    }

    setStatusMessage(null)
    setErrorMessage(null)

    const title = editingCardForm.title.trim()
    const content = editingCardForm.content.trim()

    if (!title || !content) {
      setErrorMessage('Title and narrative text are both required.')
      return
    }

    setIsSavingCardNarrative(true)

    try {
      const response = await fetch(`/api/narratives/${narrativeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          tagIds: editingCardForm.tagIds,
          unlockPassword: unlockedPasswords[narrativeId] ?? '',
        }),
      })

      const payload = await readJson<NarrativeWriteResponse | ApiError>(
        response,
      )

      if (!response.ok || !('narrative' in payload)) {
        throw new Error(
          payload.error ?? 'Could not save this narrative template.',
        )
      }

      const savedNarrative = payload.narrative

      setNarratives((currentNarratives) =>
        sortNarrativesByUpdatedAt([
          savedNarrative,
          ...currentNarratives.filter(
            (narrative) => narrative.id !== savedNarrative.id,
          ),
        ]),
      )
      setEditingCardNarrativeId(null)
      setEditingCardForm(null)
      setStatusMessage('Narrative template updated.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not save this narrative template.',
      )
    } finally {
      setIsSavingCardNarrative(false)
    }
  }

  async function handleTagSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage(null)
    setErrorMessage(null)

    const normalizedTagName = newTagName.trim()

    if (!normalizedTagName) {
      setErrorMessage('Tag name is required.')
      return
    }

    setIsSavingTag(true)

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: normalizedTagName }),
      })

      const payload = await readJson<TagResponse | ApiError>(response)

      if (!response.ok || !('tag' in payload)) {
        throw new Error(payload.error ?? 'Could not create tag.')
      }

      const savedTag = payload.tag

      setTags((currentTags) =>
        sortTagsByName([
          savedTag,
          ...currentTags.filter((tag) => tag.id !== savedTag.id),
        ]),
      )
      setForm((currentForm) =>
        currentForm.tagIds.includes(savedTag.id)
          ? currentForm
          : { ...currentForm, tagIds: [...currentForm.tagIds, savedTag.id] },
      )
      setEditingCardForm((currentForm) =>
        currentForm && !currentForm.tagIds.includes(savedTag.id)
          ? { ...currentForm, tagIds: [...currentForm.tagIds, savedTag.id] }
          : currentForm,
      )
      setNewTagName('')
      setStatusMessage(
        payload.duplicate
          ? 'Tag already existed and was selected.'
          : 'Tag created.',
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not create tag.',
      )
    } finally {
      setIsSavingTag(false)
    }
  }

  async function handleAuthSubmit(mode: 'login' | 'register') {
    setStatusMessage(null)
    setErrorMessage(null)

    const username = authUsername.trim()
    const password = authPassword

    if (!username || !password) {
      setErrorMessage('Username and password are required.')
      return
    }

    setIsSubmittingAuth(true)

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const payload = await readJson<AuthResponse | ApiError>(response)

      if (!response.ok || !('user' in payload)) {
        throw new Error(payload.error ?? 'Authentication failed.')
      }

      setSessionUser(payload.user)
      setTemplateView('mine')
      setCreateTarget('mine')
      setAuthPassword('')
      setAuthMode(null)
      setStatusMessage(mode === 'login' ? 'Signed in.' : 'Account created and signed in.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed.')
    } finally {
      setIsSubmittingAuth(false)
    }
  }

  async function handleLogout() {
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setSessionUser(null)
      setTemplateView('feed')
      setCreateTarget('feed')
      setAuthPassword('')
      setAuthMode(null)
      setStatusMessage('Signed out.')
    } catch {
      setErrorMessage('Failed to sign out.')
    }
  }

  async function handleNarrativeDelete(narrative: Narrative) {
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      const unlockPassword = await ensureUnlockedForAction(narrative, 'delete')
      if (unlockPassword === null) {
        return
      }

      if (!window.confirm('Delete this narrative template?')) {
        return
      }

      const response = await fetch(`/api/narratives/${narrative.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ unlockPassword }),
      })

      const payload = await readJson<ApiError>(response)

      if (!response.ok) {
        if (response.status === 403) {
          setUnlockedPasswords((current) => {
            const rest = { ...current }
            delete rest[narrative.id]
            return rest
          })
        }

        throw new Error(
          payload.error ?? 'Could not delete this narrative template.',
        )
      }

      setNarratives((currentNarratives) =>
        currentNarratives.filter((current) => current.id !== narrative.id),
      )

      if (editingCardNarrativeId === narrative.id) {
        setEditingCardNarrativeId(null)
        setEditingCardForm(null)
      }

      setUnlockedPasswords((current) => {
        const rest = { ...current }
        delete rest[narrative.id]
        return rest
      })

      setStatusMessage('Narrative template deleted.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not delete this narrative template.',
      )
    }
  }

  async function handleNarrativeCopy(narrativeId: string, content: string) {
    setErrorMessage(null)

    try {
      await navigator.clipboard.writeText(content)
      setCopiedNarrativeId(narrativeId)
      setStatusMessage('Narrative copied to clipboard.')
    } catch {
      setErrorMessage('Could not copy narrative to clipboard.')
    }
  }

  return (
    <main className='mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8'>
      <header className='rounded-2xl bg-linear-to-r from-slate-900 via-slate-800 to-cyan-900 p-6 text-white shadow-xl'>
        <p className='text-xs tracking-[0.2em] text-cyan-200'>
          FRONTLINE EMS WORKFLOW
        </p>
        <h1 className='mt-2 text-2xl font-semibold sm:text-3xl'>
          Narrative Template Library
        </h1>
        <p className='mt-2 max-w-3xl text-sm text-cyan-100'>
          Build reusable templates for your electronic patient care reports,
          then filter quickly with tags while writing chart narratives.
        </p>
      </header>

      <section className='rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm'>
        {sessionUser ? (
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <p className='text-sm font-semibold text-slate-900'>
                Signed in as {sessionUser.username}
              </p>
              <p className='text-xs text-slate-600'>
                You can switch between main feed templates and your personal templates.
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={() => setTemplateView('feed')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  templateView === 'feed'
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                }`}>
                Main Feed
              </button>
              <button
                type='button'
                onClick={() => setTemplateView('mine')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  templateView === 'mine'
                    ? 'bg-cyan-700 text-white'
                    : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                }`}>
                My Templates
              </button>
              <button
                type='button'
                onClick={() => void handleLogout()}
                className='rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50'>
                Log out
              </button>
            </div>
          </div>
        ) : (
          <div className='space-y-3'>
            <p className='text-sm font-semibold text-slate-900'>
              Optional account for personal templates
            </p>
            <p className='text-xs text-slate-600'>
              Without an account, you can still create and manage main feed templates.
            </p>
            {!authMode ? (
              <div className='flex flex-wrap gap-2'>
                <button
                  type='button'
                  onClick={() => setAuthMode('login')}
                  className='rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800'>
                  Log in
                </button>
                <button
                  type='button'
                  onClick={() => setAuthMode('register')}
                  className='rounded-xl bg-cyan-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-600'>
                  Create account
                </button>
              </div>
            ) : (
              <div className='space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3'>
                <p className='text-xs font-medium text-slate-700'>
                  {authMode === 'login' ? 'Log in to your account' : 'Create a new account'}
                </p>
                <div className='flex flex-col gap-2 sm:flex-row'>
                  <input
                    value={authUsername}
                    onChange={(event) => setAuthUsername(event.target.value)}
                    placeholder='username'
                    className='min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
                  />
                  <input
                    type='password'
                    value={authPassword}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    placeholder='password'
                    className='min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
                  />
                </div>
                <div className='flex flex-wrap gap-2'>
                  <button
                    type='button'
                    disabled={isSubmittingAuth}
                    onClick={() => void handleAuthSubmit(authMode)}
                    className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed ${
                      authMode === 'login'
                        ? 'bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500'
                        : 'bg-cyan-700 hover:bg-cyan-600 disabled:bg-cyan-400'
                    }`}>
                    {authMode === 'login' ? 'Log in' : 'Create account'}
                  </button>
                  <button
                    type='button'
                    disabled={isSubmittingAuth}
                    onClick={() => {
                      setAuthMode(null)
                      setAuthPassword('')
                    }}
                    className='rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed'>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* <section className="rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
        Authentication is intentionally disabled for this first version. Anyone with app access can
        create, edit, and delete templates.
      </section> */}

      {(errorMessage || statusMessage) && (
        <section
          className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
            errorMessage
              ? 'border border-rose-200 bg-rose-50 text-rose-800'
              : 'border border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}>
          {errorMessage ?? statusMessage}
        </section>
      )}

      <section className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]'>
        <article className='rounded-2xl border border-slate-200 bg-surface p-5 shadow-md'>
          <div className='flex items-center justify-between gap-3'>
            <h2 className='text-lg font-semibold text-slate-900'>
              Create Narrative Template
            </h2>
            <button
              type='button'
              onClick={resetFormForNewNarrative}
              className='rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900'>
              New
            </button>
          </div>

          <form className='mt-4 space-y-4' onSubmit={handleNarrativeSubmit}>
            <div className='space-y-1'>
              <label
                htmlFor='title'
                className='text-sm font-medium text-slate-700'>
                Template title
              </label>
              <input
                id='title'
                name='title'
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder='Ex: Stable BLS transfer'
                className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
              />
            </div>

            {sessionUser && (
              <div className='space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3'>
                <p className='text-sm font-medium text-slate-700'>Save destination</p>
                <div className='flex flex-wrap gap-2'>
                  <button
                    type='button'
                    onClick={() => setCreateTarget('feed')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      createTarget === 'feed'
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                    }`}>
                    Main Feed
                  </button>
                  <button
                    type='button'
                    onClick={() => setCreateTarget('mine')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      createTarget === 'mine'
                        ? 'bg-cyan-700 text-white'
                        : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                    }`}>
                    My Templates
                  </button>
                </div>
              </div>
            )}

            <div className='space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3'>
              <label className='flex items-center gap-2 text-sm font-medium text-slate-700'>
                <input
                  type='checkbox'
                  checked={form.isLocked}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isLocked: event.target.checked,
                      lockPassword: event.target.checked
                        ? current.lockPassword
                        : '',
                    }))
                  }
                  className='h-4 w-4 rounded border-slate-300'
                />
                Lock this template with a password
              </label>

              {form.isLocked && (
                <input
                  type='text'
                  value={form.lockPassword}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      lockPassword: event.target.value,
                    }))
                  }
                  placeholder='Enter lock password (min 4 chars)'
                  className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
                />
              )}
            </div>

            <div className='space-y-1'>
              <label
                htmlFor='content'
                className='text-sm font-medium text-slate-700'>
                Narrative text
              </label>
              <textarea
                id='content'
                name='content'
                rows={10}
                value={form.content}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    content: event.target.value,
                  }))
                }
                placeholder='Pt transferred from hospital bed to gurney with x2 EMT assist...'
                className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
              />
            </div>

            <div className='space-y-2'>
              <p className='text-sm font-medium text-slate-700'>Tags</p>
              <div className='flex flex-wrap gap-2'>
                {tags.map((tag) => {
                  const isSelected = form.tagIds.includes(tag.id)

                  return (
                    <button
                      key={tag.id}
                      type='button'
                      onClick={() => toggleNarrativeTag(tag.id)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        isSelected
                          ? 'border-cyan-700 bg-cyan-100 text-cyan-900'
                          : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-800'
                      }`}>
                      #{tag.name}
                    </button>
                  )
                })}
                {tags.length === 0 && (
                  <p className='text-xs text-slate-500'>
                    Create tags below to organize templates.
                  </p>
                )}
              </div>
            </div>

            <button
              type='submit'
              disabled={isSavingNarrative}
              className='w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400'>
              {isSavingNarrative ? 'Saving...' : 'Save template'}
            </button>
          </form>

          <form
            className='mt-6 flex flex-col gap-2 sm:flex-row'
            onSubmit={handleTagSubmit}>
            <input
              type='text'
              value={newTagName}
              onChange={(event) => setNewTagName(event.target.value)}
              placeholder='new tag (ex: dialysis)'
              className='min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
            />
            <button
              type='submit'
              disabled={isSavingTag}
              className='rounded-xl bg-cyan-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:bg-cyan-400'>
              {isSavingTag ? 'Adding...' : 'Add tag'}
            </button>
          </form>
        </article>

        <article className='rounded-2xl border border-slate-200 bg-surface p-5 shadow-md'>
          <h2 className='text-lg font-semibold text-slate-900'>
            Template Library
          </h2>

          <div className='mt-3 flex flex-wrap gap-2'>
            <button
              type='button'
              onClick={() => setSelectedFilterTagIds([])}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                selectedFilterTagIds.length === 0
                  ? 'border-slate-800 bg-slate-800 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}>
              All templates ({narratives.length})
            </button>
            {tags.map((tag) => (
              <button
                key={tag.id}
                type='button'
                onClick={() =>
                  setSelectedFilterTagIds((current) =>
                    current.includes(tag.id)
                      ? current.filter((id) => id !== tag.id)
                      : [...current, tag.id],
                  )
                }
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  selectedFilterTagIds.includes(tag.id)
                    ? 'border-cyan-800 bg-cyan-700 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                }`}>
                #{tag.name} ({tagUsageCount[tag.id] ?? 0})
              </button>
            ))}
          </div>

          <div className='mt-5 space-y-3'>
            {isLoading && (
              <p className='rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600'>
                Loading templates...
              </p>
            )}

            {!isLoading && filteredNarratives.length === 0 && (
              <p className='rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600'>
                No templates found for this filter yet.
              </p>
            )}

            {!isLoading &&
              filteredNarratives.map((narrative) => (
                <div
                  key={narrative.id}
                  role='button'
                  tabIndex={0}
                  onClick={() => void beginEditingNarrative(narrative)}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) {
                      return
                    }

                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      void beginEditingNarrative(narrative)
                    }
                  }}
                  className={`rounded-xl border p-4 transition ${
                    editingCardNarrativeId === narrative.id
                      ? 'border-cyan-500 bg-cyan-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}>
                  {copiedNarrativeId === narrative.id && (
                    <div className='mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800'>
                      Copied to clipboard
                    </div>
                  )}
                  <div className='flex items-start justify-between gap-3'>
                    <h3 className='text-base font-semibold text-slate-900'>
                      {narrative.title}
                    </h3>
                    <div className='flex items-center gap-2'>
                      {narrative.owner_id && (
                        <span className='rounded-lg border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-800'>
                          Personal
                        </span>
                      )}
                      {narrative.is_locked && (
                        <span className='rounded-lg border border-amber-300 bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900'>
                          Locked
                        </span>
                      )}
                      <button
                        type='button'
                        onClick={(event) => {
                          event.stopPropagation()
                          void handleNarrativeCopy(narrative.id, narrative.content)
                        }}
                        className='rounded-lg border border-cyan-200 px-2 py-1 text-xs font-medium text-cyan-700 transition hover:bg-cyan-50'>
                        Copy
                      </button>
                      <button
                        type='button'
                        onClick={(event) => {
                          event.stopPropagation()
                          void handleNarrativeDelete(narrative)
                        }}
                        className='rounded-lg border border-rose-200 px-2 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-50'>
                        Delete
                      </button>
                    </div>
                  </div>

                  {editingCardNarrativeId === narrative.id &&
                  editingCardForm ? (
                    <div
                      className='mt-3 space-y-3'
                      onClick={(event) => event.stopPropagation()}>
                      <input
                        value={editingCardForm.title}
                        onChange={(event) =>
                          setEditingCardForm((current) =>
                            current
                              ? {
                                  ...current,
                                  title: event.target.value,
                                }
                              : current,
                          )
                        }
                        className='w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
                      />
                      <textarea
                        rows={8}
                        value={editingCardForm.content}
                        onChange={(event) =>
                          setEditingCardForm((current) =>
                            current
                              ? {
                                  ...current,
                                  content: event.target.value,
                                }
                              : current,
                          )
                        }
                        className='w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
                      />
                      <div className='flex flex-wrap gap-2'>
                        {tags.map((tag) => {
                          const isSelected = editingCardForm.tagIds.includes(
                            tag.id,
                          )

                          return (
                            <button
                              key={`${narrative.id}-edit-${tag.id}`}
                              type='button'
                              onClick={() => toggleEditingCardTag(tag.id)}
                              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                                isSelected
                                  ? 'border-cyan-700 bg-cyan-100 text-cyan-900'
                                  : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-800'
                              }`}>
                              #{tag.name}
                            </button>
                          )
                        })}
                      </div>
                      <div className='flex gap-2'>
                        <button
                          type='button'
                          onClick={() =>
                            void handleInlineNarrativeSave(narrative.id)
                          }
                          disabled={isSavingCardNarrative}
                          className='rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500'>
                          {isSavingCardNarrative ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type='button'
                          onClick={() => {
                            setEditingCardNarrativeId(null)
                            setEditingCardForm(null)
                          }}
                          className='rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-400'>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className='mt-2 max-h-56 overflow-y-auto whitespace-pre-line rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600'>
                        {narrative.content}
                      </p>

                      <div className='mt-3 flex flex-wrap gap-2'>
                        {narrative.tags.map((tag) => (
                          <span
                            key={`${narrative.id}-${tag.id}`}
                            className='rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700'>
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  <p className='mt-3 text-xs text-slate-500'>
                    Updated {new Date(narrative.updated_at).toLocaleString()}
                  </p>
                </div>
              ))}
          </div>
        </article>
      </section>
    </main>
  )
}
