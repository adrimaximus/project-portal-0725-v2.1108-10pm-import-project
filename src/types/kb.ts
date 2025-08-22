export interface KbFolder {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  article_count?: number;
  slug: string;
}