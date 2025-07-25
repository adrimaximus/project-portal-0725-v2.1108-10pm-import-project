export type Collaborator = {
  id: string;
  name: string;
  src: string;
  fallback: string;
  online: boolean;
};

export type RequestStatus = 'Pending' | 'In Progress' | 'Completed' | 'Rejected';
export type RequestType = 'Feature' | 'Bug' | 'Feedback';

export type Request = {
  id: string;
  title: string;
  type: RequestType;
  status: RequestStatus;
  submittedBy: string;
  avatar: string;
  date: string;
};