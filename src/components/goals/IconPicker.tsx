import {
  Book, Target, Repeat, CheckCircle, TrendingUp, Award, Dumbbell, Droplet,
  Leaf, Heart, DollarSign, Briefcase, Coffee, Bed, Music, Film, Code,
  PenTool, Brush, Bike, Plane, Star, Smile, Brain, Zap, Sunrise, Sunset,
  Apple, Activity, AlarmClock, Anchor, Archive, Wallet, Trophy
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

const iconList: LucideIcon[] = [
  Book, Target, Repeat, CheckCircle, TrendingUp, Award, Dumbbell, Droplet,
  Leaf, Heart, DollarSign, Briefcase, Coffee, Bed, Music, Film, Code,
  PenTool, Brush, Bike, Plane, Star, Smile, Brain, Zap, Sunrise, Sunset,
  Apple, Activity, AlarmClock, Anchor, Archive, Wallet, Trophy
];

interface IconPickerProps {
  children: React.ReactNode;
  onSelectIcon: (icon: LucideIcon) => void;
  currentColor: string;
}

const IconPicker = ({ children, onSelectIcon, currentColor }: IconPickerProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-2">
        <div className="grid grid-cols-8 gap-1">
          {iconList.map((Icon, index) => (
            <PopoverTrigger asChild key={index}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSelectIcon(Icon)}
                className="rounded-md flex items-center justify-center"
              >
                <Icon className="h-5 w-5" style={{ color: currentColor }} />
              </Button>
            </PopoverTrigger>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default IconPicker;