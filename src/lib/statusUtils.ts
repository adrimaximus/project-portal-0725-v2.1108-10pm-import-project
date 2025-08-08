import { Project } from "@/data/projects";

export const getStatusBadgeClass = (status: Project['status']) => {
  switch (status) {
    case 'On Track':
    case 'Completed':
    case 'Done':
    case 'Billed':
      return 'bg-green-100 text-green-800';
    case 'At Risk':
    case 'On Hold':
      return 'bg-yellow-100 text-yellow-800';
    case 'Off Track':
    case 'Cancelled':
      return 'bg-red-100 text-red-800';
    case 'In Progress':
    case 'Requested':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusColor = (status: Project['status']): string => {
  switch (status) {
    case 'On Track': case 'Completed': case 'Done': case 'Billed': return '#22c55e';
    case 'At Risk': case 'On Hold': return '#eab308';
    case 'Off Track': case 'Cancelled': return '#ef4444';
    case 'In Progress': case 'Requested': return '#3b82f6';
    default: return '#9ca3af';
  }
};