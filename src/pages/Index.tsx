import { useState } from 'react';
import { Goal, dummyGoals } from '@/data/goals';
import GoalCard from '@/components/goals/GoalCard';
import GoalYearlyProgress from '@/components/goals/GoalYearlyProgress';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

const IndexPage = () => {
  const [goals, setGoals] = useState<Goal[]>(dummyGoals);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const handleSelectGoal = (goal: Goal) => {
    setSelectedGoal(goal);
  };

  const handleGoBack = () => {
    setSelectedGoal(null);
  };

  const handleToggleCompletion = (date: Date) => {
    if (!selectedGoal) return;

    const dateString = format(date, 'yyyy-MM-dd');
    
    setGoals(prevGoals => {
      return prevGoals.map(g => {
        if (g.id === selectedGoal.id) {
          const existingCompletion = g.completions.find(c => c.date === dateString);
          let newCompletions;

          if (existingCompletion) {
            newCompletions = g.completions.map(c => 
              c.date === dateString ? { ...c, completed: !c.completed } : c
            );
          } else {
            newCompletions = [...g.completions, { date: dateString, completed: true }];
          }
          
          const updatedGoal = { ...g, completions: newCompletions };
          setSelectedGoal(updatedGoal);
          return updatedGoal;
        }
        return g;
      });
    });
  };

  if (selectedGoal) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Button variant="ghost" onClick={handleGoBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke semua target
        </Button>
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${selectedGoal.color}20` }}>
            <selectedGoal.icon className="h-8 w-8" style={{ color: selectedGoal.color }} />
          </div>
          <h1 className="text-3xl font-bold">{selectedGoal.title}</h1>
        </div>
        <GoalYearlyProgress 
          completions={selectedGoal.completions}
          color={selectedGoal.color}
          onToggleCompletion={handleToggleCompletion}
          specificDays={selectedGoal.specificDays}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Target Saya</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(goal => (
          <div key={goal.id} onClick={() => handleSelectGoal(goal)} className="cursor-pointer">
            <GoalCard goal={goal} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default IndexPage;