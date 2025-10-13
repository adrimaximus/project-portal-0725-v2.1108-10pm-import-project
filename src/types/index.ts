export interface User {
  id: string;
  name: string;
  avatar_url: string;
  initials: string;
  role?: string;
}

export interface Attachment {
  id: string;
  file_url: string;
  file_name: string;
}

export interface Invoice {
  id: string;
  projectId: string;
  projectName: string;
  clientName?: string | null;
  clientLogo?: string | null;
  clientAvatarUrl?: string | null;
  clientCompanyName?: string | null;
  projectOwner?: User;
  assignedMembers: User[];
  status: string;
  poNumber?: string | null;
  amount: number;
  dueDate: string | Date;
  invoiceAttachments?: Attachment[];
}