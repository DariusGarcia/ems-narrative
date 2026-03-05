"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Tag } from "@/lib/types";
import type { NarrativeForm, SessionUser, TemplateView } from "@/app/components/narratives/types";

type Props = {
  sessionUser: SessionUser | null;
  createTarget: TemplateView;
  setCreateTarget: (view: TemplateView) => void;
  form: NarrativeForm;
  setForm: (updater: (current: NarrativeForm) => NarrativeForm) => void;
  tags: Tag[];
  newTagName: string;
  setNewTagName: (value: string) => void;
  isSavingNarrative: boolean;
  isSavingTag: boolean;
  resetFormForNewNarrative: () => void;
  toggleNarrativeTag: (tagId: string) => void;
  handleNarrativeSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleTagSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

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
  resetFormForNewNarrative,
  toggleNarrativeTag,
  handleNarrativeSubmit,
  handleTagSubmit,
}: Props) {
  const shouldUseCollapsedCreator = () => {
    if (typeof window === "undefined") {
      return false;
    }

    const compactWidth = window.matchMedia("(max-width: 1279px)").matches;
    const coarsePointerDevice = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    return compactWidth || coarsePointerDevice;
  };

  const [isMobileCollapsed, setIsMobileCollapsed] = useState(() => {
    return shouldUseCollapsedCreator();
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const widthQuery = window.matchMedia("(max-width: 1279px)");
    const pointerQuery = window.matchMedia("(hover: none) and (pointer: coarse)");

    const onChange = () => {
      setIsMobileCollapsed(shouldUseCollapsedCreator());
    };

    widthQuery.addEventListener("change", onChange);
    pointerQuery.addEventListener("change", onChange);
    return () => {
      widthQuery.removeEventListener("change", onChange);
      pointerQuery.removeEventListener("change", onChange);
    };
  }, []);

  return (
    <article className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-md">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Create Narrative Template</h2>
        <div className="flex items-center gap-2">
          {!isMobileCollapsed && (
            <button
              type="button"
              onClick={() => setIsMobileCollapsed(true)}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900 lg:hidden"
            >
              Hide
            </button>
          )}
          <button
            type="button"
            onClick={resetFormForNewNarrative}
            className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
          >
            New
          </button>
        </div>
      </div>

      {isMobileCollapsed && (
        <button
          type="button"
          onClick={() => setIsMobileCollapsed(false)}
          className="relative mt-4 block w-full rounded-xl border-2 border-dashed border-cyan-300 bg-slate-50 p-8 text-center transition hover:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 lg:hidden"
        >
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 48 48"
            aria-hidden="true"
            className="mx-auto size-10 text-slate-500"
          >
            <path
              d="M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m0-4c0 4.418-7.163 8-16 8S8 28.418 8 24m32 10v6m0 0v6m0-6h6m-6 0h-6"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="mt-3 block text-sm font-semibold text-slate-900">Add New Template</span>
          <span className="mt-1 block text-xs text-slate-600">Tap to open template creator</span>
        </button>
      )}

      <form
        className={`mt-4 space-y-4 ${isMobileCollapsed ? "hidden lg:block" : "block"}`}
        onSubmit={(event) => void handleNarrativeSubmit(event)}
      >
        <div className="space-y-1">
          <label htmlFor="title" className="text-sm font-medium text-slate-700">
            Template title
          </label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Ex: Stable BLS transfer"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2"
          />
        </div>

        {sessionUser && (
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-700">Save destination</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCreateTarget("feed")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  createTarget === "feed"
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                Main Feed
              </button>
              <button
                type="button"
                onClick={() => setCreateTarget("mine")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  createTarget === "mine"
                    ? "bg-cyan-700 text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                My Templates
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.isLocked}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isLocked: event.target.checked,
                  lockPassword: event.target.checked ? current.lockPassword : "",
                }))
              }
              className="h-4 w-4 rounded border-slate-300"
            />
            Lock this template with a password
          </label>

          {form.isLocked && (
            <input
              type="text"
              value={form.lockPassword}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  lockPassword: event.target.value,
                }))
              }
              placeholder="Enter lock password (min 4 chars)"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2"
            />
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="content" className="text-sm font-medium text-slate-700">
            Narrative text
          </label>
          <textarea
            id="content"
            name="content"
            rows={10}
            value={form.content}
            onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
            placeholder="Pt transferred from hospital bed to gurney with x2 EMT assist..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Tags</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isSelected = form.tagIds.includes(tag.id);

              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleNarrativeTag(tag.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    isSelected
                      ? "border-cyan-700 bg-cyan-100 text-cyan-900"
                      : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-800"
                  }`}
                >
                  #{tag.name}
                </button>
              );
            })}
            {tags.length === 0 && (
              <p className="text-xs text-slate-500">Create tags below to organize templates.</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSavingNarrative}
          className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSavingNarrative ? "Saving..." : "Save template"}
        </button>
      </form>

      <form
        className={`mt-6 flex flex-col gap-2 sm:flex-row ${isMobileCollapsed ? "hidden lg:flex" : "flex"}`}
        onSubmit={(event) => void handleTagSubmit(event)}
      >
        <input
          type="text"
          value={newTagName}
          onChange={(event) => setNewTagName(event.target.value)}
          placeholder="new tag (ex: dialysis)"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2"
        />
        <button
          type="submit"
          disabled={isSavingTag}
          className="rounded-xl bg-cyan-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:bg-cyan-400"
        >
          {isSavingTag ? "Adding..." : "Add tag"}
        </button>
      </form>
    </article>
  );
}
