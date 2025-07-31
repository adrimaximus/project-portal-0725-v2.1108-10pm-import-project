import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Goal } from '@/data/goals';
import { getIconComponent } from '@/data/icons';

interface GoalCardProps {
  goal: Goal;
}

const GoalCard = ({ goal }: GoalCardProps) => {
  const IconComponent = getIconComponent(goal.icon);
  return (
    <Link to={`/goals/${goal.id}`} key={goal.id}>
      <Card className="hover:border-primary transition-colors">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${goal.color}20` }}>
            <IconComponent className="h-6 w-6" style={{ color: goal.color }} />
          </div>
          <CardTitle className="text-lg font-semibold">{goal.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{goal.frequency}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default GoalCard;