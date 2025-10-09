export interface KbFolderInfo {
  name: string;
  slug: string;
}

export interface KbTag {
  id: string;
  name: string;
  color: string;
}

export interface KbCreator {
  id: string;
  name: string;
  avatar_url: string;
  initials: string;
}

export interface KbArticle {
  id: string;
  title: string;
  slug: string;
  content: any; // JSONB
  folder_id: string;
  updated_at: string;
  header_image_url?: string;
  kb_folders: KbFolderInfo;
  tags: KbTag[];
  creator: KbCreator;
}