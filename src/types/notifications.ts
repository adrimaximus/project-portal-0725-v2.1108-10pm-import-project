export interface NotificationEvent {
  id: string;
  label: string;
  description: string | null;
  category: string | null;
  is_enabled_by_default: boolean;
  default_channels?: ('email' | 'whatsapp')[];
}