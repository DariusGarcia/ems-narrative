export type NarrativeWritePayload = {
  title: string;
  content: string;
  tagIds: string[];
};

type ParseResult = {
  data?: NarrativeWritePayload;
  error?: string;
};

export function parseNarrativeWritePayload(payload: unknown): ParseResult {
  if (!payload || typeof payload !== "object") {
    return { error: "Invalid request body." };
  }

  const input = payload as {
    title?: unknown;
    content?: unknown;
    tagIds?: unknown;
  };

  const title = typeof input.title === "string" ? input.title.trim() : "";
  const content = typeof input.content === "string" ? input.content.trim() : "";

  if (!title) {
    return { error: "Title is required." };
  }

  if (!content) {
    return { error: "Narrative text is required." };
  }

  const tagIds = Array.isArray(input.tagIds)
    ? Array.from(
        new Set(
          input.tagIds
            .filter((tagId): tagId is string => typeof tagId === "string")
            .map((tagId) => tagId.trim())
            .filter((tagId) => tagId.length > 0),
        ),
      )
    : [];

  return {
    data: {
      title,
      content,
      tagIds,
    },
  };
}
