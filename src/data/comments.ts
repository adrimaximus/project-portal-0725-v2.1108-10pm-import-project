import { Comment } from './projects';
import { User } from '@/types';

export const generateComment = (id: number, project_id: number, author: User, text: string, is_ticket = false): Comment => ({
  id,
  project_id,
  author,
  created_at: new Date().toISOString(),
  text,
  is_ticket,
});