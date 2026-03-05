'use client'

import { useState } from 'react'
import type { Narrative, Tag } from '@/lib/types'
import type { NarrativeEditForm } from '@/app/components/narratives/types'

type Props = {
  tags: Tag[]
  narratives: Narrative[]
  filteredNarratives: Narrative[]
  tagUsageCount: Record<string, number>
  selectedFilterTagIds: string[]
  setSelectedFilterTagIds: (updater: (current: string[]) => string[]) => void
  searchTerm: string
  setSearchTerm: (value: string) => void
  isLoading: boolean
  editingCardNarrativeId: string | null
  editingCardForm: NarrativeEditForm | null
  setEditingCardForm: (
    updater: (current: NarrativeEditForm | null) => NarrativeEditForm | null,
  ) => void
  setEditingCardNarrativeId: (id: string | null) => void
  isSavingCardNarrative: boolean
  copiedNarrativeId: string | null
  beginEditingNarrative: (narrative: Narrative) => Promise<void>
  handleNarrativeCopy: (narrativeId: string, content: string) => Promise<void>
  handleNarrativeDelete: (narrative: Narrative) => Promise<void>
  toggleEditingCardTag: (tagId: string) => void
  handleInlineNarrativeSave: (narrativeId: string) => Promise<void>
}

export function TemplateLibrary({
  tags,
  narratives,
  filteredNarratives,
  tagUsageCount,
  selectedFilterTagIds,
  setSelectedFilterTagIds,
  searchTerm,
  setSearchTerm,
  isLoading,
  editingCardNarrativeId,
  editingCardForm,
  setEditingCardForm,
  setEditingCardNarrativeId,
  isSavingCardNarrative,
  copiedNarrativeId,
  beginEditingNarrative,
  handleNarrativeCopy,
  handleNarrativeDelete,
  toggleEditingCardTag,
  handleInlineNarrativeSave,
}: Props) {
  const [areFilterTagsMinimized, setAreFilterTagsMinimized] = useState(false)

  return (
    <article className='rounded-2xl border border-slate-200 bg-surface p-5 shadow-md'>
      <h2 className='text-lg font-semibold text-slate-900'>Template Library</h2>

      <div className='sticky top-0 z-20 mt-3 bg-surface pb-2'>
        <div className='flex items-center gap-2'>
          <div className='relative min-w-0 flex-1'>
          <svg
            aria-hidden='true'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400'>
            <path
              d='M21 21l-4.35-4.35M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z'
              strokeWidth={2}
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
          <input
            type='text'
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder='Search by title or tags...'
            className='w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
          />
          </div>
          <button
            type='button'
            onClick={() => setAreFilterTagsMinimized((current) => !current)}
            className='shrink-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-400'>
            {areFilterTagsMinimized ? 'Show tags' : 'Hide tags'}
          </button>
        </div>
      </div>

      <div className='mt-3 flex flex-wrap items-center gap-2'>
        <button
          type='button'
          onClick={() => setSelectedFilterTagIds(() => [])}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
            selectedFilterTagIds.length === 0
              ? 'border-slate-800 bg-slate-800 text-white'
              : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
          }`}>
          All templates ({narratives.length})
        </button>
        {areFilterTagsMinimized && selectedFilterTagIds.length > 0 && (
          <span className='rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800'>
            {selectedFilterTagIds.length} tag filter
            {selectedFilterTagIds.length > 1 ? 's' : ''} active
          </span>
        )}
        {tags
          .filter(
            (tag) =>
              !areFilterTagsMinimized || selectedFilterTagIds.includes(tag.id),
          )
          .map((tag) => (
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

              {editingCardNarrativeId === narrative.id && editingCardForm ? (
                <div
                  className='mt-3 space-y-3'
                  onClick={(event) => event.stopPropagation()}>
                  <input
                    value={editingCardForm.title}
                    onChange={(event) =>
                      setEditingCardForm((current) =>
                        current
                          ? { ...current, title: event.target.value }
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
                          ? { ...current, content: event.target.value }
                          : current,
                      )
                    }
                    className='w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2'
                  />
                  <div className='flex flex-wrap gap-2'>
                    {tags.map((tag) => {
                      const isSelected = editingCardForm.tagIds.includes(tag.id)
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
                        setEditingCardForm(() => null)
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
  )
}
