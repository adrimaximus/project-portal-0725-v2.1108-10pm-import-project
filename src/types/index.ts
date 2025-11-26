export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  icon_color?: string;
  is_featured?: boolean;
  created_at?: string;
}