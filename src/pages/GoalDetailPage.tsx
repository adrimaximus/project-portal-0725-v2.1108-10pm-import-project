import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { Goal } from '@/data/goals';
import { User } from '@/data/users';
import GoalDetail from '@/components/goals/GoalDetail';
import GoalYearlyProgress from '@/components/goals/GoalYearlyProgress';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import NotFound from './NotFound';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Pencil, Calendar as CalendarIcon, UserPlus } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, parseISO, endOfDay, startOfDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import GoalCollaborationManager from '@/components/goals/GoalCollaborationManager';
import { getIconComponent } from '@/data/icons';
import { useGoals } from '@/context/GoalsContext';

const GoalDetailPage = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const { getGoalById, updateGoal } = useGoals();
  
  const goal = goalId ? getGoalById(goalId) : undefined;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const handleUpdateGoal = (updatedGoal: Goal) => {
    updateGoal(updatedGoal);
    setIsEditModalOpen(false);
    setIsInviteModalOpen(false);
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
    updateGoal(updatedGoal);
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

  const Icon = getIconComponent(goal.icon);

  const dayKeys = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const specificDayKeys = goal.specificDays?.map(dayIndex => dayKeys[dayIndex]);

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
          <div className="flex items-center gap-4 flex-grow min-w-0">
            <div className="p-3 rounded-lg flex-shrink-0" style={{ backgroundColor: `${goal.color}20` }}>
              <Icon className="h-8 w-8" style={{ color: goal.color }} />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-bold whitespace-nowrap overflow-hidden text-ellipsis">{goal.title}</h1>
              <p className="text-muted-foreground">{goal.frequency}</p>
            </div>
            <div className="flex -space-x-2 overflow-hidden ml-2">
              {goal.collaborators?.map((user: User) => (
                <Avatar key={user.id} className="inline-block h-8 w-8 rounded-full border-2 border-background">
                  <AvatarFallback>{user.initials}</AvatarFallback>
                </Avatar>
              ))}
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
                        {format(dateRange.from, "LLL dd, y", { locale: enUS })} -{" "}
                        {format(dateRange.to, "LLL dd, y", { locale: enUS })}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y", { locale: enUS })
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
            <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Manage Collaborators</DialogTitle>
                  <DialogDescription>
                    Invite users to collaborate on "{goal.title}".
                  </DialogDescription>
                </DialogHeader>
                <GoalCollaborationManager
                  goal={goal}
                  onUpdate={handleUpdateGoal}
                  onClose={() => setIsInviteModalOpen(false)}
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
          specificDays={specificDayKeys}
        />
      </div>
    </PortalLayout>
  );
};

export default GoalDetailPage;