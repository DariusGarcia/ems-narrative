import type { Narrative, Tag } from "@/lib/types";
import type { NarrativeEditForm, NarrativeForm } from "@/app/components/narratives/types";

export function makeEmptyForm(): NarrativeForm {
  return {
    title: "",
    content: "",
    tagIds: [],
    isLocked: false,
    lockPassword: "",
  };
}

export function makeEditFormFromNarrative(narrative: Narrative): NarrativeEditForm {
  return {
    title: narrative.title,
    content: narrative.content,
    tagIds: narrative.tags.map((tag) => tag.id),
  };
}

export function sortNarrativesByUpdatedAt(narratives: Narrative[]): Narrative[] {
  return [...narratives].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
}

export function sortTagsByName(tags: Tag[]): Tag[] {
  return [...tags].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}

export async function readJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}
