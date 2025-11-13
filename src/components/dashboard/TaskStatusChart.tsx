import { useMemo } from 'react';
import { Task } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getTaskStatusStyles } from '@/lib/utils';

interface TaskStatusChartProps {
  tasks: Task[];
}

const TaskStatusChart = ({ tasks }: TaskStatusChartProps) => {
  const data = useMemo(() => {
    const statusCounts = {
      'To do': 0,
      'In progress': 0,
      'In review': 0,
      'Done': 0,
    };

    tasks.forEach(task => {
      const status = task.completed ? 'Done' : task.status;
      if (status in statusCounts) {
        statusCounts[status]++;
      }
    });

    return Object.entries(statusCounts)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [tasks]);

  const totalTasks = tasks.length;

  const COLORS = {
    'To do': getTaskStatusStyles('To do').hex,
    'In progress': getTaskStatusStyles('In progress').hex,
    'In review': getTaskStatusStyles('In review').hex,
    'Done': getTaskStatusStyles('Done').hex,
  };

  if (totalTasks === 0) {
    return null;
  }

  return (
    <div className="w-full h-48 relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--background))',
              borderColor: 'hsl(var(--border))',
              borderRadius: 'var(--radius)',
            }}
          />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="80%"
            dataKey="value"
            nameKey="name"
            paddingAngle={5}
          >
            {data.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-3xl font-bold">{totalTasks}</span>
        <span className="text-sm text-muted-foreground">Total Tasks</span>
      </div>
    </div>
  );
};

export default TaskStatusChart;