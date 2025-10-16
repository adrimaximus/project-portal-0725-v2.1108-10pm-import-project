import {
  LucideIcon,
  Briefcase,
  Lightbulb,
  CalendarCheck,
  Megaphone,
  Users,
  MapPin,
  Paintbrush,
  PenTool,
  Camera,
  Clapperboard,
  Mic,
  Palette,
} from "lucide-react";

export interface Service {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
}

export const services: Service[] = [
  {
    title: "End to End Services",
    description: "Comprehensive project management from ideation to execution and post-event analysis.",
    icon: Briefcase,
    iconColor: "bg-purple-100 text-purple-600",
  },
  {
    title: "Concept & Creative Development",
    description: "Developing unique and engaging concepts for your brand or event.",
    icon: Lightbulb,
    iconColor: "bg-yellow-100 text-yellow-600",
  },
  {
    title: "Event Production & Management",
    description: "Flawless execution and management for events of all scales.",
    icon: CalendarCheck,
    iconColor: "bg-green-100 text-green-600",
  },
  {
    title: "Digital Marketing & Promotion",
    description: "Strategic online campaigns to maximize reach and engagement.",
    icon: Megaphone,
    iconColor: "bg-pink-100 text-pink-600",
  },
  {
    title: "Talent & Artist Management",
    description: "Booking and managing performers, speakers, and influencers for your event.",
    icon: Users,
    iconColor: "bg-indigo-100 text-indigo-600",
  },
  {
    title: "Venue Sourcing & Management",
    description: "Finding and managing the perfect location for your event.",
    icon: MapPin,
    iconColor: "bg-red-100 text-red-600",
  },
  {
    title: "Branding & Installation Decoration",
    description: "Creative branding and on-site installation decorations to enhance your event's atmosphere.",
    icon: Paintbrush,
    iconColor: "bg-blue-100 text-blue-600",
  },
  {
    title: "Graphic Design & Copywriting",
    description: "Creating compelling visuals and written content for your project.",
    icon: PenTool,
    iconColor: "bg-orange-100 text-orange-600",
  },
  {
    title: "Photo & Video Production",
    description: "Professional photography and videography services to capture your event.",
    icon: Camera,
    iconColor: "bg-teal-100 text-teal-600",
  },
  {
    title: "Live Streaming & Hybrid Events",
    description: "Broadcasting your event to a virtual audience with professional production.",
    icon: Clapperboard,
    iconColor: "bg-cyan-100 text-cyan-600",
  },
  {
    title: "Sound & Lighting Production",
    description: "Technical production for audio and visual elements of your event.",
    icon: Mic,
    iconColor: "bg-gray-100 text-gray-600",
  },
  {
    title: "Merchandise & Swag Production",
    description: "Designing and producing custom merchandise and promotional items.",
    icon: Palette,
    iconColor: "bg-lime-100 text-lime-600",
  },
];