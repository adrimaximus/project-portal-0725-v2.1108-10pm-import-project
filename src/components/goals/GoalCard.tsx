import { Goal } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import GoalIcon from './GoalIcon';
import { calculateProgress } from '@/lib/progress';
import { Link } from 'react-router-dom';

interface GoalCardProps {
  goal: Goal;
}

export default function GoalCard({ goal }: GoalCardProps) {
  const { percentage, currentValue } = calculateProgress(goal);

  return (
    <Link to={`/goals/${goal.slug}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-4">
            <GoalIcon goal={goal} className="w-8 h-8" />
            <h3 className="text-lg font-semibold truncate">{goal.title}</h3>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground h-10 overflow-hidden">{goal.description}</p>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>
                {goal.type === 'quantity'
                  ? `${currentValue} / ${goal.target_quantity}`
                  : `$${currentValue.toFixed(2)} / $${goal.target_value?.toFixed(2)}`}
              </span>
            </div>
            <Progress value={percentage} />
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex flex-wrap gap-2">
            {goal.tags.map(tag => (
              <Badge key={tag.id} style={{ backgroundColor: tag.color, color: 'white' }}>
                {tag.name}
              </Badge>
            ))}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}