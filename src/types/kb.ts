export type KbFolder = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  updated_at: string;
  article_count: number;
  collaborators: { id: string; name: string; avatar_url: string, initials: string }[];
};