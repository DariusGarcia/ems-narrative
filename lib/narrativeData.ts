import type { Narrative } from "@/lib/types";

export const NARRATIVE_SELECT = `
  id,
  title,
  content,
  created_at,
  updated_at,
  is_locked,
  narrative_tags (
    tags (
      id,
      name
    )
  )
`;

type NarrativeTagRelation = {
  tags:
    | {
        id: string;
        name: string;
      }
    | {
        id: string;
        name: string;
      }[]
    | null;
};

function relationToTags(relation: NarrativeTagRelation): { id: string; name: string }[] {
  if (!relation.tags) {
    return [];
  }

  if (Array.isArray(relation.tags)) {
    return relation.tags;
  }

  return [relation.tags];
}

export type NarrativeRow = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_locked: boolean;
  narrative_tags: NarrativeTagRelation[] | null;
};

export function mapNarrativeRow(row: NarrativeRow): Narrative {
  const tags =
    row.narrative_tags?.flatMap((relation) =>
      relationToTags(relation).map((tag) => ({
        id: tag.id,
        name: tag.name,
      })),
    ) ?? [];

  return {
    id: row.id,
    title: row.title,
    content: row.content,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_locked: row.is_locked,
    tags,
  };
}
