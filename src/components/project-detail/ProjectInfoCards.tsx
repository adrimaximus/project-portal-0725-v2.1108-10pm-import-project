import { Project, ProjectStatus, PaymentStatus } from '@/data/projects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectInfoCardsProps {
  project: Project;
  isEditing: boolean;
  editedProject: Project;
  onSelectChange: (name: 'status' | 'paymentStatus', value: string) => void;
  onDateChange: (name: 'deadline' | 'paymentDueDate' | 'startDate', date: Date | undefined) => void;
  onBudgetChange: (value: number | undefined) => void;
}

const ProjectInfoCards = ({ project }: ProjectInfoCardsProps) => {
  const statusOptions: ProjectStatus[] = ['On Track', 'At Risk', 'Off Track', 'On Hold', 'Completed'];
  const paymentStatusOptions: PaymentStatus[] = ['Paid', 'Partially Paid', 'Unpaid', 'Overdue'];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader><CardTitle>Status</CardTitle></CardHeader>
        <CardContent>{project.status}</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
        <CardContent>{project.paymentStatus}</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Deadline</CardTitle></CardHeader>
        <CardContent>{project.deadline}</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Budget</CardTitle></CardHeader>
        <CardContent>${project.budget.toLocaleString()}</CardContent>
      </Card>
    </div>
  );
};

export default ProjectInfoCards;