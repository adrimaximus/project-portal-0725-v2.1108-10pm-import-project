export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  icon_color: string;
  is_featured: boolean;
}

export interface Person {
  id: string;
  full_name: string;
  job_title?: string;
  company?: string;
  contact?: {
    emails?: string[];
    phones?: string[];
  };
  notes?: string;
  avatar_url?: string;
  address?: any;
  social_media?: any;
  birthday?: string;
  department?: string;
}