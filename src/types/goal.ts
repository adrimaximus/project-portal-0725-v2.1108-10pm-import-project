import { Tag } from './tag';

export interface UserProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  initials: string;
  email?: string;
}

export interface GoalCompletion {
  id: string;
  date: string;
  value: number;
  notes: string | null;
  userId: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  icon: string;
  icon_url: string | null;
  color: string;
  type: string;
  target_quantity: number | null;
  target_value: number | null;
  frequency: string | null;
  target_period: string | null;
  unit: string | null;
  specific_days: string[] | null;
  created_at: string;
  updated_at: string;
  slug: string;
  tags: Tag[] | null;
  collaborators: UserProfile[] | null;
  completions: GoalCompletion[];
}