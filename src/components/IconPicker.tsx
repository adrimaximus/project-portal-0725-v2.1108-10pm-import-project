import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import * as LucideIcons from "lucide-react";
import { useState } from "react";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";

const iconNames = [
  "Activity", "Airplay", "AlarmClock", "AlertCircle", "Archive", "ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight",
  "Award", "BarChart", "Battery", "Bell", "Book", "Bookmark", "Briefcase", "Building", "Calendar", "Camera",
  "CheckCircle", "ChevronDown", "ChevronUp", "ChevronLeft", "ChevronRight", "Clipboard", "Clock", "Cloud",
  "Code", "Command", "Compass", "Copy", "CreditCard", "Database", "Delete", "Disc", "DollarSign", "Download",
  "Edit", "ExternalLink", "Eye", "Facebook", "File", "Filter", "Flag", "Folder", "Gift", "Github", "Globe",
  "Grid", "HardDrive", "Hash", "Heart", "HelpCircle", "Home", "Image", "Inbox", "Info", "Instagram", "Key",
  "Layout", "LifeBuoy", "Link", "Linkedin", "List", "Lock", "LogIn", "LogOut", "Mail", "Map", "MapPin",
  "Maximize", "Menu", "MessageCircle", "Mic", "Minimize", "Minus", "Monitor", "Moon", "MoreHorizontal",
  "MoreVertical", "MousePointer", "Move", "Music", "Package", "Paperclip", "Pause", "PenTool", "Percent",
  "Phone", "PieChart", "Play", "Plus", "Power", "Printer", "Radio", "RefreshCcw", "Repeat", "RotateCcw",
  "Save", "Scissors", "Search", "Send", "Server", "Settings", "Share2", "Shield", "ShoppingBag", "ShoppingCart",
  "Sidebar", "Sliders", "Smartphone", "Speaker", "Star", "Sun", "Sunrise", "Sunset", "Table", "Tag", "Target",
  "Terminal", "ThumbsDown", "ThumbsUp", "ToggleLeft", "ToggleRight", "Tool", "Trash2", "TrendingUp", "Truck",
  "Twitter", "Type", "Umbrella", "Unlock", "Upload", "User", "UserCheck", "UserMinus", "UserPlus", "Users",
  "Video", "Voicemail", "Volume2", "Watch", "Wifi", "Wind", "X", "Youtube", "Zap"
];

const Icons = LucideIcons as unknown as { [key: string]: LucideIcons.LucideIcon };

const IconPicker = ({ value, onChange }: { value?: string; onChange: (icon: string) => void }) => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredIcons = iconNames.filter(name => name.toLowerCase().includes(search.toLowerCase()));

  const SelectedIcon = value ? Icons[value] : Icons["Link"];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          {SelectedIcon && <SelectedIcon className="h-4 w-4" />}
          {value || "Select an icon"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <Input
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ScrollArea className="h-64">
            <div className="grid grid-cols-6 gap-2 p-2">
              {filteredIcons.map(name => {
                const IconComponent = Icons[name];
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