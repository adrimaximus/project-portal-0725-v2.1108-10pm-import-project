import { User } from './user';

export type FolderAccessLevel = 'private' | 'public_view' | 'public_edit';

export interface KbFolderCollaborator {
  user: User;
  role: 'viewer' | 'editor';
}

export interface KbFolder {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  article_count?: number;
  slug: string;
  icon?: string;
  color?: string;
  category?: string;
  access_level?: FolderAccessLevel;
  collaborators?: KbFolderCollaborator[];
}

export interface KbArticle {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  content: any;
  folder_id: string;
  updated_at: string;
  header_image_url?: string;
  kb_folders: {
    name: string;
    slug: string;
  };
  tags?: { id: string; name: string; color: string }[];
  creator?: { id: string; name: string; avatar_url?: string; initials: string };
}