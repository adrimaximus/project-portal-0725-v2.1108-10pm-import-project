export interface Member {
  id: string;
  name: string;
  avatar_url: string;
  initials: string;
  role: string;
}

export interface Attachment {
  id: string;
  file_url: string;
  file_name: string;
}

export interface Invoice {
  id: string;
  projectName: string;
  projectId: string;
  clientName: string | null;
  clientLogo?: string | null;
  clientCompanyName?: string | null;
  projectOwner: Member | null;
  assignedMembers: Member[];
  status: string;
  poNumber: string | null;
  amount: number;
  dueDate: Date | string | null;
  invoiceAttachments: Attachment[];
  clientCompanyCustomProperties?: { [key: string]: any };
  hardcopySendingDate?: Date | string | null;
  emailSendingDate?: Date | string | null;
}