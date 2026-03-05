"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Narrative, Tag } from "@/lib/types";
import type {
  ApiError,
  AuthResponse,
  NarrativeEditForm,
  NarrativeForm,
  NarrativesResponse,
  NarrativeWriteResponse,
  SessionUser,
  TagResponse,
  TagsResponse,
  TemplateView,
} from "@/app/components/narratives/types";
import {
  makeEditFormFromNarrative,
  makeEmptyForm,
  readJson,
  sortNarrativesByUpdatedAt,
  sortTagsByName,
} from "@/app/components/narratives/utils";

export function useNarrativeManager() {
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedFilterTagIds, setSelectedFilterTagIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCardNarrativeId, setEditingCardNarrativeId] = useState<string | null>(null);
  const [editingCardForm, setEditingCardForm] = useState<NarrativeEditForm | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [form, setForm] = useState<NarrativeForm>(makeEmptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingNarrative, setIsSavingNarrative] = useState(false);
  const [isSavingTag, setIsSavingTag] = useState(false);
  const [isSavingCardNarrative, setIsSavingCardNarrative] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [templateView, setTemplateView] = useState<TemplateView>("feed");
  const [createTarget, setCreateTarget] = useState<TemplateView>("feed");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
  const [unlockedPasswords, setUnlockedPasswords] = useState<Record<string, string>>({});
  const [copiedNarrativeId, setCopiedNarrativeId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const scope = templateView === "mine" ? "mine" : "feed";
      const [tagsResponse, narrativesResponse] = await Promise.all([
        fetch("/api/tags", { cache: "no-store" }),
        fetch(`/api/narratives?scope=${scope}`, { cache: "no-store" }),
      ]);

      const tagsPayload = await readJson<TagsResponse>(tagsResponse);
      const narrativesPayload = await readJson<NarrativesResponse>(narrativesResponse);

      if (!tagsResponse.ok) {
        throw new Error(tagsPayload.error ?? "Could not load tags.");
      }

      if (!narrativesResponse.ok) {
        throw new Error(narrativesPayload.error ?? "Could not load narrative templates.");
      }

      setTags(sortTagsByName(tagsPayload.tags ?? []));
      setNarratives(sortNarrativesByUpdatedAt(narrativesPayload.narratives ?? []));
      setSessionUser(narrativesPayload.user ?? null);
      if (!narrativesPayload.user) {
        setTemplateView("feed");
        setCreateTarget("feed");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not load your narrative library.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [templateView]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.matchMedia("(max-width: 1024px)").matches) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, []);

  useEffect(() => {
    if (!copiedNarrativeId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopiedNarrativeId((current) => (current === copiedNarrativeId ? null : current));
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [copiedNarrativeId]);

  useEffect(() => {
    if (!statusMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setStatusMessage((current) => (current === statusMessage ? null : current));
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [statusMessage]);

  const filteredNarratives = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return narratives.filter((narrative) => {
      const narrativeTagIds = new Set(narrative.tags.map((tag) => tag.id));
      const matchesSelectedTags = selectedFilterTagIds.every((tagId) => narrativeTagIds.has(tagId));

      if (!matchesSelectedTags) {
        return false;
      }

      if (!normalizedSearchTerm) {
        return true;
      }

      const searchableText = [narrative.title, ...narrative.tags.map((tag) => tag.name)]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearchTerm);
    });
  }, [narratives, selectedFilterTagIds, searchTerm]);

  const tagUsageCount = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const narrative of narratives) {
      for (const tag of narrative.tags) {
        counts[tag.id] = (counts[tag.id] ?? 0) + 1;
      }
    }

    return counts;
  }, [narratives]);

  function resetFormForNewNarrative() {
    setForm(makeEmptyForm());
    setEditingCardNarrativeId(null);
    setEditingCardForm(null);
    setStatusMessage(null);
    setErrorMessage(null);
  }

  async function ensureUnlockedForAction(
    narrative: Narrative,
    action: "edit" | "delete",
  ): Promise<string | null> {
    if (!narrative.is_locked) {
      return "";
    }

    const cachedPassword = unlockedPasswords[narrative.id];
    if (cachedPassword) {
      return cachedPassword;
    }

    const password = window.prompt(
      `This template is locked. Enter password to ${action} "${narrative.title}".`,
    );

    if (!password) {
      return null;
    }

    const unlockResponse = await fetch(`/api/narratives/${narrative.id}/unlock`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    const unlockPayload = await readJson<ApiError>(unlockResponse);

    if (!unlockResponse.ok) {
      setErrorMessage(unlockPayload.error ?? "Incorrect password for locked template.");
      return null;
    }

    setUnlockedPasswords((current) => ({
      ...current,
      [narrative.id]: password,
    }));

    if (action === "edit") {
      setStatusMessage("Template unlocked for editing.");
    }

    return password;
  }

  async function beginEditingNarrative(narrative: Narrative) {
    const unlockPassword = await ensureUnlockedForAction(narrative, "edit");

    if (unlockPassword === null) {
      return;
    }

    setEditingCardNarrativeId(narrative.id);
    setEditingCardForm(makeEditFormFromNarrative(narrative));
    setErrorMessage(null);
  }

  function toggleNarrativeTag(tagId: string) {
    setForm((currentForm) => {
      if (currentForm.tagIds.includes(tagId)) {
        return {
          ...currentForm,
          tagIds: currentForm.tagIds.filter((id) => id !== tagId),
        };
      }

      return {
        ...currentForm,
        tagIds: [...currentForm.tagIds, tagId],
      };
    });
  }

  function toggleEditingCardTag(tagId: string) {
    setEditingCardForm((currentForm) => {
      if (!currentForm) {
        return currentForm;
      }

      if (currentForm.tagIds.includes(tagId)) {
        return {
          ...currentForm,
          tagIds: currentForm.tagIds.filter((id) => id !== tagId),
        };
      }

      return {
        ...currentForm,
        tagIds: [...currentForm.tagIds, tagId],
      };
    });
  }

  async function handleNarrativeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    const title = form.title.trim();
    const content = form.content.trim();

    if (!title || !content) {
      setErrorMessage("Title and narrative text are both required.");
      return;
    }

    if (form.isLocked && form.lockPassword.trim().length < 4) {
      setErrorMessage("Lock password must be at least 4 characters.");
      return;
    }

    setIsSavingNarrative(true);

    try {
      const response = await fetch("/api/narratives", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          tagIds: form.tagIds,
          isLocked: form.isLocked,
          lockPassword: form.lockPassword,
          templateScope: createTarget,
        }),
      });

      const payload = await readJson<NarrativeWriteResponse | ApiError>(response);

      if (!response.ok || !("narrative" in payload)) {
        throw new Error(payload.error ?? "Could not save this narrative template.");
      }

      const savedNarrative = payload.narrative;

      setNarratives((currentNarratives) =>
        sortNarrativesByUpdatedAt([
          savedNarrative,
          ...currentNarratives.filter((narrative) => narrative.id !== savedNarrative.id),
        ]),
      );
      setForm(makeEmptyForm());
      setStatusMessage("Narrative template created.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not save this narrative template.",
      );
    } finally {
      setIsSavingNarrative(false);
    }
  }

  async function handleInlineNarrativeSave(narrativeId: string) {
    if (!editingCardForm) {
      return;
    }

    setStatusMessage(null);
    setErrorMessage(null);

    const title = editingCardForm.title.trim();
    const content = editingCardForm.content.trim();

    if (!title || !content) {
      setErrorMessage("Title and narrative text are both required.");
      return;
    }

    setIsSavingCardNarrative(true);

    try {
      const response = await fetch(`/api/narratives/${narrativeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          tagIds: editingCardForm.tagIds,
          unlockPassword: unlockedPasswords[narrativeId] ?? "",
        }),
      });

      const payload = await readJson<NarrativeWriteResponse | ApiError>(response);

      if (!response.ok || !("narrative" in payload)) {
        throw new Error(payload.error ?? "Could not save this narrative template.");
      }

      const savedNarrative = payload.narrative;

      setNarratives((currentNarratives) =>
        sortNarrativesByUpdatedAt([
          savedNarrative,
          ...currentNarratives.filter((narrative) => narrative.id !== savedNarrative.id),
        ]),
      );
      setEditingCardNarrativeId(null);
      setEditingCardForm(null);
      setStatusMessage("Narrative template updated.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not save this narrative template.",
      );
    } finally {
      setIsSavingCardNarrative(false);
    }
  }

  async function handleTagSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    const normalizedTagName = newTagName.trim();

    if (!normalizedTagName) {
      setErrorMessage("Tag name is required.");
      return;
    }

    setIsSavingTag(true);

    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: normalizedTagName }),
      });

      const payload = await readJson<TagResponse | ApiError>(response);

      if (!response.ok || !("tag" in payload)) {
        throw new Error(payload.error ?? "Could not create tag.");
      }

      const savedTag = payload.tag;

      setTags((currentTags) =>
        sortTagsByName([savedTag, ...currentTags.filter((tag) => tag.id !== savedTag.id)]),
      );
      setForm((currentForm) =>
        currentForm.tagIds.includes(savedTag.id)
          ? currentForm
          : { ...currentForm, tagIds: [...currentForm.tagIds, savedTag.id] },
      );
      setEditingCardForm((currentForm) =>
        currentForm && !currentForm.tagIds.includes(savedTag.id)
          ? { ...currentForm, tagIds: [...currentForm.tagIds, savedTag.id] }
          : currentForm,
      );
      setNewTagName("");
      setStatusMessage(payload.duplicate ? "Tag already existed and was selected." : "Tag created.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not create tag.");
    } finally {
      setIsSavingTag(false);
    }
  }

  async function handleAuthSubmit(mode: "login" | "register") {
    setStatusMessage(null);
    setErrorMessage(null);

    const username = authUsername.trim();
    const password = authPassword;

    if (!username || !password) {
      setErrorMessage("Username and password are required.");
      return;
    }

    setIsSubmittingAuth(true);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const payload = await readJson<AuthResponse | ApiError>(response);

      if (!response.ok || !("user" in payload)) {
        throw new Error(payload.error ?? "Authentication failed.");
      }

      setSessionUser(payload.user);
      setTemplateView("mine");
      setCreateTarget("mine");
      setAuthPassword("");
      setAuthMode(null);
      setStatusMessage(mode === "login" ? "Signed in." : "Account created and signed in.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setIsSubmittingAuth(false);
    }
  }

  async function handleLogout() {
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setSessionUser(null);
      setTemplateView("feed");
      setCreateTarget("feed");
      setAuthPassword("");
      setAuthMode(null);
      setStatusMessage("Signed out.");
    } catch {
      setErrorMessage("Failed to sign out.");
    }
  }

  async function handleNarrativeDelete(narrative: Narrative) {
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const unlockPassword = await ensureUnlockedForAction(narrative, "delete");
      if (unlockPassword === null) {
        return;
      }

      if (!window.confirm("Delete this narrative template?")) {
        return;
      }

      const response = await fetch(`/api/narratives/${narrative.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ unlockPassword }),
      });

      const payload = await readJson<ApiError>(response);

      if (!response.ok) {
        if (response.status === 403) {
          setUnlockedPasswords((current) => {
            const rest = { ...current };
            delete rest[narrative.id];
            return rest;
          });
        }

        throw new Error(payload.error ?? "Could not delete this narrative template.");
      }

      setNarratives((currentNarratives) =>
        currentNarratives.filter((current) => current.id !== narrative.id),
      );

      if (editingCardNarrativeId === narrative.id) {
        setEditingCardNarrativeId(null);
        setEditingCardForm(null);
      }

      setUnlockedPasswords((current) => {
        const rest = { ...current };
        delete rest[narrative.id];
        return rest;
      });

      setStatusMessage("Narrative template deleted.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not delete this narrative template.",
      );
    }
  }

  async function handleNarrativeCopy(narrativeId: string, content: string) {
    setErrorMessage(null);

    try {
      await navigator.clipboard.writeText(content);
      setCopiedNarrativeId(narrativeId);
      setStatusMessage("Narrative copied to clipboard.");
    } catch {
      setErrorMessage("Could not copy narrative to clipboard.");
    }
  }

  return {
    narratives,
    tags,
    selectedFilterTagIds,
    setSelectedFilterTagIds,
    searchTerm,
    setSearchTerm,
    editingCardNarrativeId,
    setEditingCardNarrativeId,
    editingCardForm,
    setEditingCardForm,
    newTagName,
    setNewTagName,
    form,
    setForm,
    isLoading,
    isSavingNarrative,
    isSavingTag,
    isSavingCardNarrative,
    statusMessage,
    errorMessage,
    sessionUser,
    templateView,
    setTemplateView,
    createTarget,
    setCreateTarget,
    authUsername,
    setAuthUsername,
    authPassword,
    setAuthPassword,
    isSubmittingAuth,
    authMode,
    setAuthMode,
    copiedNarrativeId,
    filteredNarratives,
    tagUsageCount,
    resetFormForNewNarrative,
    beginEditingNarrative,
    toggleNarrativeTag,
    toggleEditingCardTag,
    handleNarrativeSubmit,
    handleInlineNarrativeSave,
    handleTagSubmit,
    handleAuthSubmit,
    handleLogout,
    handleNarrativeDelete,
    handleNarrativeCopy,
  };
}
