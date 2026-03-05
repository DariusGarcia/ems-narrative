"use client";

import { AuthPanel } from "@/app/components/narratives/AuthPanel";
import { TemplateCreatorCard } from "@/app/components/narratives/TemplateCreatorCard";
import { TemplateLibrary } from "@/app/components/narratives/TemplateLibrary";
import { useNarrativeManager } from "@/app/components/narratives/useNarrativeManager";

export default function Home() {
  const model = useNarrativeManager();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-2xl bg-linear-to-r from-slate-900 via-slate-800 to-cyan-900 p-6 text-white shadow-xl">
        <p className="text-xs tracking-[0.2em] text-cyan-200">FRONTLINE EMS WORKFLOW</p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Narrative Template Library</h1>
        <p className="mt-2 max-w-3xl text-sm text-cyan-100">
          Build reusable templates for your electronic patient care reports, then filter quickly
          with tags while writing chart narratives.
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
              ? "border border-rose-200 bg-rose-50 text-rose-800"
              : "border border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {model.errorMessage ?? model.statusMessage}
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
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
          resetFormForNewNarrative={model.resetFormForNewNarrative}
          toggleNarrativeTag={model.toggleNarrativeTag}
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
          searchTerm={model.searchTerm}
          setSearchTerm={model.setSearchTerm}
          isLoading={model.isLoading}
          editingCardNarrativeId={model.editingCardNarrativeId}
          editingCardForm={model.editingCardForm}
          setEditingCardForm={model.setEditingCardForm}
          setEditingCardNarrativeId={model.setEditingCardNarrativeId}
          isSavingCardNarrative={model.isSavingCardNarrative}
          copiedNarrativeId={model.copiedNarrativeId}
          beginEditingNarrative={model.beginEditingNarrative}
          handleNarrativeCopy={model.handleNarrativeCopy}
          handleNarrativeDelete={model.handleNarrativeDelete}
          toggleEditingCardTag={model.toggleEditingCardTag}
          handleInlineNarrativeSave={model.handleInlineNarrativeSave}
        />
      </section>
    </main>
  );
}
