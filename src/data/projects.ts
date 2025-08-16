import { Project } from '@/types';

// Enums for status values
export enum ProjectStatus {
  Requested = "Requested",
  InProgress = "In Progress",
  InReview = "In Review",
  OnHold = "On Hold",
  Completed = "Completed",
  Canceled = "Canceled",
}

export enum PaymentStatus {
  Paid = "Paid",
  Pending = "Pending",
  Overdue = "Overdue",
  Draft = "Draft",
}

// Dummy data for components that need it
export const dummyProjects: Project[] = [];