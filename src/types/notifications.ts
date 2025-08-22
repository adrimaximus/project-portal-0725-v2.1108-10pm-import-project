export interface Notification {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  link?: string;
  actor: {
    id: string;
    name: string;
    avatar?: string;
  };
}