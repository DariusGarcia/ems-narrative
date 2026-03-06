'use client'

import { AuthPanel } from '@/app/components/narratives/AuthPanel'
import { TemplateCreatorCard } from '@/app/components/narratives/TemplateCreatorCard'
import { TemplateLibrary } from '@/app/components/narratives/TemplateLibrary'
import { useNarrativeManager } from '@/app/components/narratives/useNarrativeManager'

export default function Home() {
  const model = useNarrativeManager()

  const openSignInFromFavoritePrompt = () => {
    model.closeFavoriteSignInPrompt()
    model.setAuthMode('login')
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <main className='mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8'>
      <header className='rounded-2xl bg-linear-to-r from-slate-900 via-slate-800 to-cyan-900 p-6 text-white shadow-xl'>
        <p className='text-xs tracking-[0.2em] text-cyan-200'>EMS WORKFLOW</p>
        <h1 className='mt-2 text-2xl font-semibold sm:text-3xl'>
          Narrative Template Library
        </h1>
        <p className='mt-2 max-w-3xl text-sm text-cyan-100'>
          Build reusable templates for your electronic patient care reports,
          then filter quickly with tags while writing chart narratives.
        </p>
      </header>

      <AuthPanel
        sessionUser={model.sessionUser}
        templateView={model.templateView}
        setTemplateView={model.setTemplateView}
        handleLogout={model.handleLogout}
        authMode={model.authMode}
        setAuthMode={model.setAuthMode}
        authUsername={model.authUsername}
        setAuthUsername={model.setAuthUsername}
        authPassword={model.authPassword}
        setAuthPassword={model.setAuthPassword}
        isSubmittingAuth={model.isSubmittingAuth}
        handleAuthSubmit={model.handleAuthSubmit}
      />

      {(model.errorMessage || model.statusMessage) && (
        <section
          className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
            model.errorMessage
              ? 'border border-rose-200 bg-rose-50 text-rose-800'
              : 'border border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}>
          {model.errorMessage ?? model.statusMessage}
        </section>
      )}

      {model.favoriteSignInPrompt.visible && (
        <div
          className='fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-[1px]'
          role='dialog'
          aria-modal='true'
          onClick={model.closeFavoriteSignInPrompt}>
          <div className='absolute inset-0 flex items-center justify-center p-4 sm:hidden'>
            <div
              className='w-full max-w-sm rounded-xl border border-cyan-200 bg-cyan-50 p-3 shadow-xl'
              onClick={(event) => event.stopPropagation()}>
              <p className='text-sm text-cyan-900'>
                Sign in to add templates to favorites.
              </p>
              <div className='mt-3 flex items-center justify-end gap-2'>
                <button
                  type='button'
                  onClick={openSignInFromFavoritePrompt}
                  className='rounded-lg bg-cyan-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-cyan-600'>
                  Sign in
                </button>
                <button
                  type='button'
                  onClick={model.closeFavoriteSignInPrompt}
                  className='rounded-lg border border-cyan-300 bg-white px-3 py-1.5 text-xs font-medium text-cyan-800 transition hover:border-cyan-400'>
                  Close
                </button>
              </div>
            </div>
          </div>

          <div
            className='absolute hidden max-w-[90vw] rounded-xl border border-cyan-200 bg-cyan-50 p-3 shadow-xl sm:block'
            style={{
              left: model.favoriteSignInPrompt.x,
              top: model.favoriteSignInPrompt.y,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={(event) => event.stopPropagation()}>
            <p className='text-sm text-cyan-900'>
              Sign in to add templates to favorites.
            </p>
            <div className='mt-3 flex items-center justify-end gap-2'>
              <button
                type='button'
                onClick={openSignInFromFavoritePrompt}
                className='rounded-lg bg-cyan-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-cyan-600'>
                Sign in
              </button>
              <button
                type='button'
                onClick={model.closeFavoriteSignInPrompt}
                className='rounded-lg border border-cyan-300 bg-white px-3 py-1.5 text-xs font-medium text-cyan-800 transition hover:border-cyan-400'>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <section className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]'>
        <TemplateCreatorCard
          sessionUser={model.sessionUser}
          createTarget={model.createTarget}
          setCreateTarget={model.setCreateTarget}
          form={model.form}
          setForm={model.setForm}
          tags={model.tags}
          newTagName={model.newTagName}
          setNewTagName={model.setNewTagName}
          isSavingNarrative={model.isSavingNarrative}
          isSavingTag={model.isSavingTag}
          errorMessage={model.errorMessage}
          isDraftCopyBannerVisible={model.isDraftCopyBannerVisible}
          resetFormForNewNarrative={model.resetFormForNewNarrative}
          toggleNarrativeTag={model.toggleNarrativeTag}
          selectedAutoCallTypes={model.selectedAutoCallTypes}
          autoGenerateInput={model.autoGenerateInput}
          toggleAutoCallType={model.toggleAutoCallType}
          setAutoGenerateField={model.setAutoGenerateField}
          handleAutoGenerateNarrative={model.handleAutoGenerateNarrative}
          clearDraftCopyBanner={model.clearDraftCopyBanner}
          handleDraftNarrativeCopy={model.handleDraftNarrativeCopy}
          handleNarrativeSubmit={model.handleNarrativeSubmit}
          handleTagSubmit={model.handleTagSubmit}
        />

        <TemplateLibrary
          tags={model.tags}
          narratives={model.narratives}
          filteredNarratives={model.filteredNarratives}
          tagUsageCount={model.tagUsageCount}
          selectedFilterTagIds={model.selectedFilterTagIds}
          setSelectedFilterTagIds={model.setSelectedFilterTagIds}
          showFavoritesOnly={model.showFavoritesOnly}
          setShowFavoritesOnly={model.setShowFavoritesOnly}
          templateView={model.templateView}
          setTemplateView={model.setTemplateView}
          searchTerm={model.searchTerm}
          setSearchTerm={model.setSearchTerm}
          isLoading={model.isLoading}
          sessionUser={model.sessionUser}
          editingCardNarrativeId={model.editingCardNarrativeId}
          editingCardForm={model.editingCardForm}
          setEditingCardForm={model.setEditingCardForm}
          setEditingCardNarrativeId={model.setEditingCardNarrativeId}
          isSavingCardNarrative={model.isSavingCardNarrative}
          copiedNarrativeId={model.copiedNarrativeId}
          favoritePendingIds={model.favoritePendingIds}
          beginEditingNarrative={model.beginEditingNarrative}
          handleNarrativeCopy={model.handleNarrativeCopy}
          handleNarrativeFavoriteToggle={model.handleNarrativeFavoriteToggle}
          handleFavoriteRequiresSignIn={model.handleFavoriteRequiresSignIn}
          handleNarrativeDelete={model.handleNarrativeDelete}
          toggleEditingCardTag={model.toggleEditingCardTag}
          handleInlineNarrativeSave={model.handleInlineNarrativeSave}
        />
      </section>
    </main>
  )
}
