import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { dummyGoals, Goal } from '@/data/goals';
import GoalDetail from '@/components/goals/GoalDetail';
import GoalYearlyProgress from '@/components/goals/GoalYearlyProgress';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import NotFound from './NotFound';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pencil, Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, parseISO, endOfDay, startOfDay } from 'date-fns';

const GoalDetailPage = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const initialGoal = dummyGoals.find(g => g.id === goalId);

  const [goal, setGoal] = useState<Goal | undefined>(initialGoal);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const handleUpdateGoal = (updatedGoal: Goal) => {
    setGoal(updatedGoal);
    setIsEditModalOpen(false);
  };

  const handleToggleCompletion = (date: Date) => {
    if (!goal) return;

    const dateString = format(startOfDay(date), 'yyyy-MM-dd');
    const existingCompletion = goal.completions.find(c => format(parseISO(c.date), 'yyyy-MM-dd') === dateString);

    let newCompletions;
    if (existingCompletion) {
      newCompletions = goal.completions.map(c => 
        format(parseISO(c.date), 'yyyy-MM-dd') === dateString 
          ? { ...c, completed: !c.completed } 
          : c
      );
    } else {
      newCompletions = [...goal.completions, { date: date.toISOString(), completed: true }];
    }

    const updatedGoal = { ...goal, completions: newCompletions };
    setGoal(updatedGoal);
  };

  if (!goal) {
    return <PortalLayout><NotFound /></PortalLayout>;
  }

  const filteredCompletions = dateRange?.from
    ? goal.completions.filter(c => {
        const completionDate = parseISO(c.date);
        const intervalEnd = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from!);
        return isWithinInterval(completionDate, { start: dateRange.from!, end: intervalEnd });
      })
    : goal.completions;

  const Icon = goal.icon;

  return (
    <PortalLayout>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/goals">Goals</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{goal.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${goal.color}20` }}>
              <Icon className="h-8 w-8" style={{ color: goal.color }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{goal.title}</h1>
              <p className="text-muted-foreground">{goal.frequency}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[260px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Goal</DialogTitle>
                </DialogHeader>
                <GoalDetail 
                  goal={goal} 
                  onUpdate={handleUpdateGoal}
                  onClose={() => setIsEditModalOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <GoalYearlyProgress 
          completions={filteredCompletions} 
          color={goal.color}
          onToggleCompletion={handleToggleCompletion}
          frequency={goal.frequency}
          specificDays={goal.specificDays}
        />
      </div>
    </PortalLayout>
  );
};

export default GoalDetailPage;