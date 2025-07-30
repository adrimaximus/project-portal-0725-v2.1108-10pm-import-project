import { Goal } from '@/data/goals';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';

interface GoalCardProps {
  goal: Goal;
}

const GoalCard = ({ goal }: GoalCardProps) => {
  const completed = goal.completions.filter(c => c.completed).length;
  const total = goal.completions.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const getIconBackgroundColor = () => {
    const color = goal.color;
    if (color.startsWith('#')) {
      let fullHex = color;
      if (color.length === 4) {
        fullHex = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
      }
      if (fullHex.length === 7) {
        return `${fullHex}33`;
      }
    }
    return 'rgba(128, 128, 128, 0.2)';
  };

  return (
    <Link to={`/goal/${goal.id}`} className="block hover:no-underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg">
      <Card className="hover:border-primary transition-colors h-full">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg mt-1" style={{ backgroundColor: getIconBackgroundColor() }}>
              <goal.icon className="h-6 w-6" style={{ color: goal.color }} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg leading-tight">{goal.title}</CardTitle>
              <CardDescription className="mt-1">{goal.frequency}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center text-sm text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{completed} / {total}</span>
          </div>
          <Progress value={progress} indicatorStyle={{ backgroundColor: goal.color }} />
        </CardContent>
      </Card>
    </Link>
  );
};

export default GoalCard;