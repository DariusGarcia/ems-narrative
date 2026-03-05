'use client'

import { useState, useSyncExternalStore } from 'react'
import type { FormEvent } from 'react'
import type { Tag } from '@/lib/types'
import { AUTO_CALL_TYPE_OPTIONS } from '@/app/components/narratives/types'
import type {
  AutoCallType,
  AutoGenerateInput,
  NarrativeForm,
  SessionUser,
  TemplateView,
} from '@/app/components/narratives/types'

type Props = {
  sessionUser: SessionUser | null
  createTarget: TemplateView
  setCreateTarget: (view: TemplateView) => void
  form: NarrativeForm
  setForm: (updater: (current: NarrativeForm) => NarrativeForm) => void
  tags: Tag[]
  newTagName: string
  setNewTagName: (value: string) => void
  isSavingNarrative: boolean
  isSavingTag: boolean
  errorMessage: string | null
  resetFormForNewNarrative: () => void
  toggleNarrativeTag: (tagId: string) => void
  selectedAutoCallTypes: AutoCallType[]
  autoGenerateInput: AutoGenerateInput
  toggleAutoCallType: (callType: AutoCallType) => void
  setAutoGenerateField: (field: keyof AutoGenerateInput, value: string) => void
  handleAutoGenerateNarrative: () => void
  handleDraftNarrativeCopy: () => void
  handleNarrativeSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleTagSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
}

export function TemplateCreatorCard({
  sessionUser,
  createTarget,
  setCreateTarget,
  form,
  setForm,
  tags,
  newTagName,
  setNewTagName,
  isSavingNarrative,
  isSavingTag,
  errorMessage,
  resetFormForNewNarrative,
  toggleNarrativeTag,
  selectedAutoCallTypes,
  autoGenerateInput,
  toggleAutoCallType,
  setAutoGenerateField,
  handleAutoGenerateNarrative,
  handleDraftNarrativeCopy,
  handleNarrativeSubmit,
  handleTagSubmit,
}: Props) {
  const shouldUseCollapsedCreator = () => {
    if (typeof window === 'undefined') {
      return false
    }

    const compactWidth = window.matchMedia('(max-width: 1279px)').matches
    const coarsePointerDevice = window.matchMedia(
      '(hover: none) and (pointer: coarse)',
    ).matches

    return compactWidth || coarsePointerDevice
  }

  const isCompactDevice = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') {
        return () => {}
      }

      const widthQuery = window.matchMedia('(max-width: 1279px)')
      const pointerQuery = window.matchMedia(
        '(hover: none) and (pointer: coarse)',
      )
      const listener = () => onStoreChange()

      widthQuery.addEventListener('change', listener)
      pointerQuery.addEventListener('change', listener)

      return () => {
        widthQuery.removeEventListener('change', listener)
        pointerQuery.removeEventListener('change', listener)
      }
    },
    shouldUseCollapsedCreator,
    () => false,
  )

  const [collapsedOverride, setCollapsedOverride] = useState<boolean | null>(
    null,
  )
  const [isAutoGenerateMinimized, setIsAutoGenerateMinimized] = useState(false)
  const isMobileCollapsed = collapsedOverride ?? isCompactDevice

  return (
    <article className='rounded-2xl border border-slate-200 bg-surface p-5 shadow-md'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='text-lg font-semibold text-slate-900'>
          Create Narrative Template
        </h2>
        <div className='flex items-center gap-2'>
          {!isMobileCollapsed && (
            <button
              type='button'
              onClick={() => setCollapsedOverride(true)}
              className='rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900 lg:hidden'>
              Hide
            </button>
          )}
          <button
            type='button'
            onClick={resetFormForNewNarrative}
            className='rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900'>
            New
          </button>
        </div>
      </div>

      {isMobileCollapsed && (
        <button
          type='button'
          onClick={() => setCollapsedOverride(false)}
          className='relative mt-4 block w-full rounded-xl border-2 border-dashed border-cyan-300 bg-slate-50 p-8 text-center transition hover:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 lg:hidden'>
          <svg
            fill='none'
            stroke='currentColor'
            viewBox='0 0 48 48'
            aria-hidden='true'
            className='mx-auto size-10 text-slate-500'>
            <path
              d='M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m0-4c0 4.418-7.163 8-16 8S8 28.418 8 24m32 10v6m0 0v6m0-6h6m-6 0h-6'
              strokeWidth={2}
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
          <span className='mt-3 block text-sm font-semibold text-slate-900'>
            Add New Template
          </span>
          <span className='mt-1 block text-xs text-slate-600'>
            Tap to open template creator
          </span>
        </button>
      )}

      <form
        className={`mt-4 space-y-4 ${isMobileCollapsed ? 'hidden lg:block' : 'block'}`}
        onSubmit={(event) => void handleNarrativeSubmit(event)}>
        <div className='space-y-1'>
          <label htmlFor='title' className='text-sm font-medium text-slate-700'>
            Template title
          </label>
          <input
            id='title'
            name='title'
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder='Ex: Stable BLS transfer'
            className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
          />
        </div>

        <div className='space-y-3 rounded-xl border border-cyan-200 bg-cyan-50/60 p-3'>
          <div className='flex items-center justify-between gap-2'>
            <p className='text-sm font-semibold text-slate-800'>
              Auto-Generate by Call Type
            </p>
            <button
              type='button'
              onClick={() =>
                setIsAutoGenerateMinimized((current) => !current)
              }
              className='rounded-lg border border-cyan-300 bg-white px-3 py-1 text-xs font-medium text-cyan-800 transition hover:border-cyan-400'>
              {isAutoGenerateMinimized ? 'Show' : 'Minimize'}
            </button>
          </div>

          {!isAutoGenerateMinimized && (
            <>
              <div className='flex flex-wrap gap-2'>
                {AUTO_CALL_TYPE_OPTIONS.map((option) => {
                  const isSelected = selectedAutoCallTypes.includes(option)

                  return (
                    <button
                      key={option}
                      type='button'
                      onClick={() => toggleAutoCallType(option)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        isSelected
                          ? 'border-cyan-700 bg-cyan-100 text-cyan-900'
                          : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-800'
                      }`}>
                      {option}
                    </button>
                  )
                })}
              </div>

              <div className='grid gap-2 sm:grid-cols-2'>
            <input
              type='text'
              value={autoGenerateInput.unit}
              onChange={(event) =>
                setAutoGenerateField('unit', event.target.value)
              }
              placeholder='Ambulance unit #'
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
            />
            <input
              type='text'
              value={autoGenerateInput.age}
              onChange={(event) =>
                setAutoGenerateField('age', event.target.value)
              }
              placeholder='Age'
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
            />
            <input
              type='text'
              value={autoGenerateInput.chiefComplaint}
              onChange={(event) =>
                setAutoGenerateField('chiefComplaint', event.target.value)
              }
              placeholder='Chief complaint '
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
            />
            <input
              type='text'
              value={autoGenerateInput.origin}
              onChange={(event) =>
                setAutoGenerateField('origin', event.target.value)
              }
              placeholder='Origin location'
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
            />
            <input
              type='text'
              value={autoGenerateInput.destination}
              onChange={(event) =>
                setAutoGenerateField('destination', event.target.value)
              }
              placeholder='Destination location'
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
            />
            <input
              type='text'
              value={autoGenerateInput.gender}
              onChange={(event) =>
                setAutoGenerateField('gender', event.target.value)
              }
              placeholder='Gender'
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
            />
            <input
              type='text'
              value={autoGenerateInput.originNurseName}
              onChange={(event) =>
                setAutoGenerateField('originNurseName', event.target.value)
              }
              placeholder='Origin nurse name'
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
            />
            <input
              type='text'
              value={autoGenerateInput.destinationNurseName}
              onChange={(event) =>
                setAutoGenerateField('destinationNurseName', event.target.value)
              }
              placeholder='Destination nurse name'
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
            />
            <input
              type='text'
              value={autoGenerateInput.reasonForTransport}
              onChange={(event) =>
                setAutoGenerateField('reasonForTransport', event.target.value)
              }
              placeholder='Reason for transport (psych eval)'
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
            />
            <input
              type='text'
              value={autoGenerateInput.requiresAmbulanceTransport}
              onChange={(event) =>
                setAutoGenerateField(
                  'requiresAmbulanceTransport',
                  event.target.value,
                )
              }
              placeholder='Requires ambulance due to (bed confined)'
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
            />
            <input
              type='text'
              value={autoGenerateInput.painScale}
              onChange={(event) =>
                setAutoGenerateField('painScale', event.target.value)
              }
              placeholder='Pain scale'
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
            />
            <input
              type='text'
              value={autoGenerateInput.codeStatus}
              onChange={(event) =>
                setAutoGenerateField('codeStatus', event.target.value)
              }
              placeholder='Code status (DNR or Full Code)'
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
            />
            <input
              type='text'
              value={autoGenerateInput.aoxStatus}
              onChange={(event) =>
                setAutoGenerateField('aoxStatus', event.target.value)
              }
              placeholder='AxOx status'
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
            />
            <input
              type='text'
              value={autoGenerateInput.gcs}
              onChange={(event) =>
                setAutoGenerateField('gcs', event.target.value)
              }
              placeholder='GCS'
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
            />
            <input
              type='text'
              value={autoGenerateInput.pmhx}
              onChange={(event) =>
                setAutoGenerateField('pmhx', event.target.value)
              }
              placeholder='PMHx'
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
            />
            <input
              type='text'
              value={autoGenerateInput.transferMethod}
              onChange={(event) =>
                setAutoGenerateField('transferMethod', event.target.value)
              }
              placeholder='Transfer method (drawsheet)'
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
            />
            <input
              type='text'
              value={autoGenerateInput.allergies}
              onChange={(event) =>
                setAutoGenerateField('allergies', event.target.value)
              }
              placeholder='Allergies'
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
            />
              </div>
              {selectedAutoCallTypes.length === 0 && (
                <p className='rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800'>
                  Select at least one call type to auto-generate a narrative.
                </p>
              )}
              <button
                type='button'
                onClick={handleAutoGenerateNarrative}
                className='w-full rounded-xl bg-cyan-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-600'>
                Auto Generate Narrative
              </button>
            </>
          )}
        </div>

        {sessionUser && (
          <div className='space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3'>
            <p className='text-sm font-medium text-slate-700'>
              Save destination
            </p>
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

        <div className='space-y-1'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <label
                htmlFor='content'
                className='text-sm font-medium text-slate-700'>
                Narrative text
              </label>
            </div>
            <button
              type='button'
              onClick={handleDraftNarrativeCopy}
              className='rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900'>
              Copy
            </button>
          </div>
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
        {errorMessage === 'Title and narrative text are both required.' && (
          <p className='rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800'>
            Title and narrative text are both required.
          </p>
        )}

        <button
          type='submit'
          disabled={isSavingNarrative}
          className='w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400'>
          {isSavingNarrative ? 'Saving...' : 'Save template'}
        </button>
      </form>

      <form
        className={`mt-6 flex flex-col gap-2 sm:flex-row ${isMobileCollapsed ? 'hidden lg:flex' : 'flex'}`}
        onSubmit={(event) => void handleTagSubmit(event)}>
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
  )
}
