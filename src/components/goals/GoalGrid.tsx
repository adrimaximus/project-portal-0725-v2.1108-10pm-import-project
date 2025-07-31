import { Goal } from '@/data/goals';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { getIconComponent } from '@/data/icons';

interface GoalGridProps {
  goals: Goal[];
  selectedGoal: Goal | null;
  onSelectGoal: (goal: Goal) => void;
}

const GoalGrid = ({ goals, selectedGoal, onSelectGoal }: GoalGridProps) => {
  return (
    <ToggleGroup
      type="single"
      value={selectedGoal?.id.toString()}
      onValueChange={(value) => {
        const goal = goals.find(g => g.id.toString() === value);
        if (goal) {
          onSelectGoal(goal);
        }
      }}
      className="grid grid-cols-3 gap-2"
    >
      {goals.map((goal) => {
        const IconComponent = getIconComponent(goal.icon);
        return (
          <ToggleGroupItem
            key={goal.id}
            value={goal.id.toString()}
            aria-label={goal.title}
            className="h-auto p-2 flex flex-col gap-2 aspect-square"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${goal.color}20` }}
            >
              <IconComponent className="h-5 w-5" style={{ color: goal.color }} />
            </div>
            <span className="text-xs text-center leading-tight">{goal.title}</span>
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
};

export default GoalGrid;