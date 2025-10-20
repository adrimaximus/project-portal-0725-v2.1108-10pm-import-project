export interface Person {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  job_title?: string | null;
  avatar_url?: string | null;
  contact?: {
    emails?: string[];
    phones?: string[];
  } | null;
  social_media?: {
    instagram?: string;
  } | null;
  company_id?: string | null;
}