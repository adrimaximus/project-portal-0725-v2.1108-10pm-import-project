export interface Ticket {
  id: number;
  text: string;
  user: {
    name: string;
    avatar: string;
  };
  timestamp: string;
  status: 'Open' | 'In Progress' | 'Closed';
}