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
  tags: Tag[];
};
