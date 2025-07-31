import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { dummyGoals, Goal } from "@/data/goals";
import GoalsPage from "@/pages/GoalsPage";
import GoalDetailPage from "@/pages/GoalDetailPage";
import NotFound from "@/pages/NotFound";
import { LucideIcon } from "lucide-react";
import { 
  Target, TrendingUp, Users, CheckCircle, Award, BarChart, Activity, Bike, BookOpen, 
  Brain, Calendar, Dumbbell, Flame, Heart, Leaf, Moon, PenTool, Footprints, Smile, Sunrise, Wallet, Zap,
  Coffee, Code, DollarSign, GraduationCap, Headphones, MapPin, Paintbrush, Plane, ShoppingCart, Utensils
} from "lucide-react";

const iconComponents: { [key: string]: LucideIcon } = {
  Target, TrendingUp, Users, CheckCircle, Award, BarChart, Activity, Bike, BookOpen, 
  Brain, Calendar, Dumbbell, Flame, Heart, Leaf, Moon, PenTool, Footprints, Smile, Sunrise, Wallet, Zap,
  Coffee, Code, DollarSign, GraduationCap, Headphones, MapPin, Paintbrush, Plane, ShoppingCart, Utensils
};

function App() {
  const [goals, setGoals] = useState<Goal[]>(dummyGoals);

  const handleGoalCreate = (newGoalData: Omit<Goal, 'id' | 'icon' | 'completions' | 'collaborators'> & { icon: string }) => {
    const newGoal: Goal = {
      ...newGoalData,
      id: `goal-${Date.now()}`,
      completions: [],
      collaborators: [],
      icon: iconComponents[newGoalData.icon] || Target,
    };
    setGoals(prevGoals => [...prevGoals, newGoal]);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GoalsPage goals={goals} onGoalCreate={handleGoalCreate} />} />
        <Route path="/goals/:id" element={<GoalDetailPage goals={goals} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;