export interface TaskAttachment {
  id?: string;
  file_url: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  url?: string; // for compatibility
  name?: string; // for compatibility
}