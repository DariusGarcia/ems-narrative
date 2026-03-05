import type { Narrative, Tag } from "@/lib/types";

export type SessionUser = {
  id: string;
  username: string;
};

export type NarrativeWriteResponse = {
  narrative: Narrative;
  error?: string;
};

export type NarrativesResponse = {
  narratives: Narrative[];
  user: SessionUser | null;
  error?: string;
};

export type TagResponse = {
  tag: Tag;
  duplicate?: boolean;
  error?: string;
};

export type TagsResponse = {
  tags: Tag[];
  error?: string;
};

export type ApiError = {
  error?: string;
};

export type AuthResponse = {
  user: SessionUser;
  error?: string;
};

export type NarrativeForm = {
  title: string;
  content: string;
  tagIds: string[];
  isLocked: boolean;
  lockPassword: string;
};

export type NarrativeEditForm = {
  title: string;
  content: string;
  tagIds: string[];
};

export type TemplateView = "feed" | "mine";
