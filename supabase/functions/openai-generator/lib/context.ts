// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const fetchContext = async (userSupabase: ReturnType<typeof createClient>) => {
  const { data: projects, error: rpcError } = await userSupabase.rpc('get_dashboard_projects', { p_limit: 1000, p_offset: 0 });
  if (rpcError) throw new Error(`Failed to fetch project data: ${rpcError.message}`);

  const { data: users, error: usersError } = await userSupabase.from('profiles').select('id, first_name, last_name, email');
  if (usersError) throw new Error(`Failed to fetch users: ${usersError.message}`);

  const { data: goals, error: goalsError } = await userSupabase.rpc('get_user_goals');
  if (goalsError) throw new Error(`Failed to fetch goals: ${goalsError.message}`);

  const summarizedProjects = projects.map(p => ({
    name: p.name,
    status: p.status,
    tasks: (p.tasks || []).map(t => ({
      title: t.title,
      completed: t.completed,
      assignedTo: (t.assignedTo || []).map(a => a.name)
    }))
  }));

  const summarizedGoals = goals.map(g => ({
    title: g.title,
    type: g.type,
    progress: g.completions ? g.completions.length : 0,
    tags: g.tags ? g.tags.map(t => t.name) : []
  }));

  const userList = users.map(u => ({ id: u.id, name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email }));
  
  const serviceList = [ "3D Graphic Design", "Accommodation", "Award Ceremony", "Branding", "Content Creation", "Digital Marketing", "Entertainment", "Event Decoration", "Event Equipment", "Event Gamification", "Exhibition Booth", "Food & Beverage", "Keyvisual Graphic Design", "LED Display", "Lighting System", "Logistics", "Man Power", "Merchandise", "Motiongraphic Video", "Multimedia System", "Payment Advance", "Photo Documentation", "Plaque & Trophy", "Prints", "Professional Security", "Professional video production for commercial ads", "Show Management", "Slido", "Sound System", "Stage Production", "Talent", "Ticket Management System", "Transport", "Venue", "Video Documentation", "VIP Services", "Virtual Events", "Awards System", "Brand Ambassadors", "Electricity & Genset", "Event Consultation", "Workshop" ];
  const iconList = [ 'Target', 'Flag', 'BookOpen', 'Dumbbell', 'TrendingUp', 'Star', 'Heart', 'Rocket', 'DollarSign', 'FileText', 'ImageIcon', 'Award', 'BarChart', 'Calendar', 'CheckCircle', 'Users', 'Activity', 'Anchor', 'Aperture', 'Bike', 'Briefcase', 'Brush', 'Camera', 'Car', 'ClipboardCheck', 'Cloud', 'Code', 'Coffee', 'Compass', 'Cpu', 'CreditCard', 'Crown', 'Database', 'Diamond', 'Feather', 'Film', 'Flame', 'Flower', 'Gift', 'Globe', 'GraduationCap', 'Headphones', 'Home', 'Key', 'Laptop', 'Leaf', 'Lightbulb', 'Link', 'Map', 'Medal', 'Mic', 'Moon', 'MousePointer', 'Music', 'Paintbrush', 'Palette', 'PenTool', 'Phone', 'PieChart', 'Plane', 'Puzzle', 'Save', 'Scale', 'Scissors', 'Settings', 'Shield', 'ShoppingBag', 'Smile', 'Speaker', 'Sun', 'Sunrise', 'Sunset', 'Sword', 'Tag', 'Trophy', 'Truck', 'Umbrella', 'Video', 'Wallet', 'Watch', 'Wind', 'Wrench', 'Zap' ];

  return {
    summarizedProjects,
    summarizedGoals,
    userList,
    serviceList,
    iconList,
    rawProjects: projects,
    rawGoals: goals,
  };
};