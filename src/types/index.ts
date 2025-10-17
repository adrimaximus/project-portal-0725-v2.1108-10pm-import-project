export const PROJECT_STATUS_OPTIONS = [
  { value: 'On Track', label: 'On Track' },
  { value: 'At Risk', label: 'At Risk' },
  { value: 'Off Track', label: 'Off Track' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Archived', label: 'Archived' },
];

export interface Project {
  id: string;
  name: string;
  status: string;
  assignedTo: { id: string; name: string; }[];
  // Add other project fields as needed
}