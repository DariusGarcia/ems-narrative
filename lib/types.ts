export type Tag = {
  id: string;
  name: string;
};

export type Narrative = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_locked: boolean;
  owner_id: string | null;
  is_favorited: boolean;
  favorite_count: number;
  tags: Tag[];
};
