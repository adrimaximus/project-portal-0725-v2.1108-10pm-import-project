import {
  History,
  GitCommit,
  FileUp,
  ArrowRightCircle,
  MessageSquare,
  Ticket,
  UserPlus,
  CheckCircle2,
  RefreshCw,
  CreditCard,
  Briefcase,
  Edit,
  UserMinus,
  File,
  GitPullRequestDraft,
} from "lucide-react";

const ActivityIcon = ({ type }: { type: string }) => {
  const iconProps = { className: "h-4 w-4 text-muted-foreground" };

  switch (type) {
    case "GIT_COMMIT":
      return <GitPullRequestDraft {...iconProps} />;
    case "FILE_UPLOADED":
      return <FileUp {...iconProps} />;
    case "PROJECT_STATUS_UPDATED":
      return <ArrowRightCircle {...iconProps} />;
    case "COMMENT_ADDED":
      return <MessageSquare {...iconProps} />;
    case "TICKET_CREATED":
      return <Ticket {...iconProps} />;
    case "TEAM_MEMBER_ADDED":
      return <UserPlus {...iconProps} />;
    case "TASK_CREATED":
      return <Briefcase {...iconProps} />;
    case "TASK_COMPLETED":
      return <CheckCircle2 {...iconProps} />;
    case "TASK_REOPENED":
      return <RefreshCw {...iconProps} />;
    case "PAYMENT_STATUS_UPDATED":
      return <CreditCard {...iconProps} />;
    case "PROJECT_DETAILS_UPDATED":
      return <Edit {...iconProps} />;
    case "TEAM_MEMBER_REMOVED":
      return <UserMinus {...iconProps} />;
    case "SERVICE_ADDED":
    case "SERVICE_REMOVED":
      return <Briefcase {...iconProps} />;
    default:
      return <History {...iconProps} />;
  }
};

export default ActivityIcon;