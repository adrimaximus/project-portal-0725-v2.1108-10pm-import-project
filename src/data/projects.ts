import { allUsers, User } from './users';

export interface AssignedUser extends User {}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  assignedTo?: string[];
}

export interface Comment {
  id: string;
  projectId: string;
  user: AssignedUser;
  text: string;
  timestamp: string;
  isTicket: boolean;
}

export interface Ticket {
  id: string;
  text: string;
  status: 'Open' | 'In Progress' | 'Closed';
}

export interface Project {
  id:string;
  name: string;
  description: string;
  status: "Requested" | "On Going" | "Completed" | "Cancelled" | "Done" | "Billed" | "In Progress" | "On Hold";
  progress: number;
  startDate: string;
  deadline: string;
  paymentDueDate?: string;
  budget: number;
  paymentStatus: "proposed" | "pending" | "paid" | "approved" | "po_created" | "on_process" | "cancelled";
  createdBy: AssignedUser;
  assignedTo: AssignedUser[];
  services: string[];
  briefFiles?: File[];
  tasks?: Task[];
  comments?: Comment[];
  tickets?: Ticket[];
  invoiceAttachmentUrl?: string;
}

export const dummyProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'New Branding for "Innovate Inc."',
    description: '<p>Complete rebranding strategy for a tech startup. Includes new logo, color palette, and brand guidelines.</p>',
    status: 'In Progress',
    progress: 75,
    startDate: '2024-06-15',
    deadline: '2024-08-15',
    paymentDueDate: '2024-09-30',
    budget: 75000000,
    paymentStatus: 'pending',
    createdBy: allUsers[0],
    assignedTo: [allUsers[1], allUsers[2]],
    services: ['Branding', 'UI/UX Design'],
    tasks: [
      { id: 'task-1', text: 'Finalize logo concepts', completed: true, assignedTo: [allUsers[1].id] },
      { id: 'task-2', text: 'Develop brand guidelines document', completed: true, assignedTo: [allUsers[1].id] },
      { id: 'task-3', text: 'Design website mockups', completed: false, assignedTo: [allUsers[2].id] },
      { id: 'task-4', text: 'Create social media templates', completed: false, assignedTo: [allUsers[1].id, allUsers[2].id] },
    ],
    comments: [
      { id: 'comment-1', projectId: 'proj-1', user: allUsers[1], text: 'The client loves the new logo direction!', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), isTicket: false },
      { id: 'comment-2', projectId: 'proj-1', user: allUsers[0], text: 'We need to schedule a review for the website mockups by the end of the week.', timestamp: new Date(Date.now() - 86400000).toISOString(), isTicket: true },
    ],
    tickets: [
        { id: 'ticket-1', text: 'Review website mockups', status: 'Open' }
    ],
    invoiceAttachmentUrl: 'https://example.com/invoice.pdf'
  },
];