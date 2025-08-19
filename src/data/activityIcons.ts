import React from "react";
import {
  FileText,
  MessageSquare,
  ListChecks,
  CheckCircle,
  Trash2,
  UserPlus,
  UserMinus,
  CreditCard,
  Pencil,
  FileUp,
  Ticket,
  Undo2,
  Briefcase,
  UserCog,
  Wallet,
  Calendar,
  MapPin,
} from "lucide-react";

export const activityIconMap: Record<string, React.ElementType> = {
  PROJECT_CREATED: FileText,
  COMMENT_ADDED: MessageSquare,
  TASK_CREATED: ListChecks,
  TASK_COMPLETED: CheckCircle,
  TASK_DELETED: Trash2,
  TEAM_MEMBER_ADDED: UserPlus,
  TEAM_MEMBER_REMOVED: UserMinus,
  PAYMENT_STATUS_UPDATED: CreditCard,
  PROJECT_STATUS_UPDATED: Pencil,
  PROJECT_DETAILS_UPDATED: Pencil,
  FILE_UPLOADED: FileUp,
  TICKET_CREATED: Ticket,
  TASK_REOPENED: Undo2,
  SERVICE_ADDED: Briefcase,
  SERVICE_REMOVED: Briefcase,
  OWNERSHIP_TRANSFERRED: UserCog,
  BUDGET_UPDATED: Wallet,
  TIMELINE_UPDATED: Calendar,
  VENUE_UPDATED: MapPin,
};

export function getActivityIcon(type: string, className = "h-4 w-4 text-muted-foreground") {
  const IconComp = activityIconMap[type] || FileText;
  return React.createElement(IconComp, { className });
}