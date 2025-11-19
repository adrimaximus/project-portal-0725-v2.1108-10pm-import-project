import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import * as LucideIcons from "lucide-react";
import { useState } from "react";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";

const iconNames = [
  'Activity', 'Anchor', 'Aperture', 'Award', 'BarChart', 'Bike', 'BookOpen', 'Briefcase', 'Brush', 'Calendar', 'Camera', 'Car', 'CheckCircle', 'ClipboardCheck', 'Cloud', 'Code', 'Coffee', 'Compass', 'Cpu', 'CreditCard', 'Crown', 'Database', 'Diamond', 'DollarSign', 'Dumbbell', 'Feather', 'FileText', 'Film', 'Flag', 'Flame', 'Flower', 'Gamepad2', 'Gift', 'Globe', 'GraduationCap', 'Guitar', 'HardDrive', 'Headphones', 'Heart', 'Home', 'ImageIcon', 'Key', 'Laptop', 'Leaf', 'Lightbulb', 'Link', 'Map', 'Medal', 'Mic', 'Moon', 'MountainSnow', 'MousePointer', 'Music', 'Paintbrush', 'Palette', 'PenTool', 'Phone', 'PieChart', 'Plane', 'Puzzle', 'Rocket', 'Save', 'Scale', 'Scissors', 'Settings', 'Shield', 'Ship', 'ShoppingBag', 'Smile', 'Speaker', 'Sprout', 'Star', 'Sun', 'Sunrise', 'Sunset', 'Sword', 'Tag', 'Target', 'Tent', 'TrainFront', 'TreePine', 'TrendingUp', 'Trophy', 'Truck', 'Umbrella', 'Users', 'Utensils', 'Video', 'Volleyball', 'Wallet', 'Watch', 'Waves', 'Wind', 'Wine', 'Wrench', 'Zap'
];

const Icons = LucideIcons as unknown as { [key: string]: LucideIcons.LucideIcon };

const IconPicker = ({ value, onChange }: { value?: string; onChange: (icon: string) => void }) => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredIcons = iconNames.filter(name => name.toLowerCase().includes(search.toLowerCase()));

  const SelectedIcon = value ? Icons[value === 'ImageIcon' ? 'Image' : value] : Icons["Link"];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          {SelectedIcon && <SelectedIcon className="h-4 w-4" />}
          {value || "Select an icon"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px]">
        <div className="space-y-2">
          <Input
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ScrollArea className="h-64" onWheel={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-8 gap-2 p-2">
              {filteredIcons.map(name => {
                const IconComponent = Icons[name === 'ImageIcon' ? 'Image' : name];
                if (!IconComponent) return null;
                return (
                  <Button
                    key={name}
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      onChange(name);
                      setIsOpen(false);
                    }}
                  >
                    <IconComponent className="h-5 w-5" />
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default IconPicker;