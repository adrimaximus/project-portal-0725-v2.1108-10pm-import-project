import { useParams, Link } from 'react-router-dom';
import { Goal } from '@/data/goals';
import PortalLayout from '@/components/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface GoalDetailPageProps {
  goals: Goal[];
}

const GoalDetailPage = ({ goals }: GoalDetailPageProps) => {
  const { id } = useParams<{ id: string }>();
  const goal = goals.find(g => g.id === id);

  if (!goal) {
    return (
      <PortalLayout>
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold mb-2">Goal Not Found</h1>
          <p className="text-muted-foreground mb-4">
            Sorry, we couldn't find the goal you're looking for.
          </p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Goals
            </Link>
          </Button>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Goals
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: `${goal.color}20` }}>
            <goal.icon className="h-8 w-8" style={{ color: goal.color }} />
          </div>
          <CardTitle className="text-2xl font-bold">{goal.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-muted-foreground">Frequency: {goal.frequency}</p>
        </CardContent>
      </Card>
    </PortalLayout>
  );
};

export default GoalDetailPage;