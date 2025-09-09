// @ts-nocheck
export const buildContext = async (supabaseClient, user) => {
  console.log("[DIAGNOSTIC] buildContext: Starting context build.");
  try {
    const [
      projectsRes,
      usersRes,
      goalsRes,
      allTagsRes,
      articlesRes,
      foldersRes
    ] = await Promise.all([
      supabaseClient.rpc('get_dashboard_projects', { p_limit: 100, p_offset: 0 }),
      supabaseClient.from('profiles').select('id, first_name, last_name, email'),
      supabaseClient.rpc('get_user_goals'),
      supabaseClient.from('tags').select('id, name'),
      supabaseClient.rpc('get_user_kb_articles'),
      supabaseClient.rpc('get_user_kb_folders')
    ]);
    console.log("[DIAGNOSTIC] buildContext: All parallel fetches completed.");

    const handleResult = (res, name) => {
        if (res.error) {
            console.warn(`[CONTEXT WARNING] Failed to fetch ${name}:`, res.error.message);
            return [];
        }
        return res.data;
    };

    const projectsData = handleResult(projectsRes, 'projects');
    const usersData = handleResult(usersRes, 'users');
    const goalsData = handleResult(goalsRes, 'goals');
    const allTagsData = handleResult(allTagsRes, 'tags');
    const articlesData = handleResult(articlesRes, 'articles');
    const foldersData = handleResult(foldersRes, 'folders');
    
    console.log("[DIAGNOSTIC] buildContext: All data fetches processed.");

    const summarizedProjects = projectsData.map(p => ({
        name: p.name,
        status: p.status,
        description: p.description ? p.description.substring(0, 100) + '...' : '',
    }));
    const summarizedGoals = goalsData.map(g => ({
        title: g.title,
        type: g.type,
        progress: g.completions ? g.completions.length : 0,
        tags: g.tags ? g.tags.map(t => t.name) : []
    }));
    const userList = usersData.map(u => ({ id: u.id, name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email }));
    const serviceList = [ "3D Graphic Design", "Accommodation", "Award Ceremony", "Branding", "Content Creation", "Digital Marketing", "Entertainment", "Event Decoration", "Event Equipment", "Event Gamification", "Exhibition Booth", "Food & Beverage", "Keyvisual Graphic Design", "LED Display", "Lighting System", "Logistics", "Man Power", "Merchandise", "Motiongraphic Video", "Multimedia System", "Payment Advance", "Photo Documentation", "Plaque & Trophy", "Prints", "Professional Security", "Professional video production for commercial ads", "Show Management", "Slido", "Sound System", "Stage Production", "Talent", "Ticket Management System", "Transport", "Venue", "Video Documentation", "VIP Services", "Virtual Events", "Awards System", "Brand Ambassadors", "Electricity & Genset", "Event Consultation", "Workshop" ];
    const iconList = [ 'Target', 'Flag', 'BookOpen', 'Dumbbell', 'TrendingUp', 'Star', 'Heart', 'Rocket', 'DollarSign', 'FileText', 'ImageIcon', 'Award', 'BarChart', 'Calendar', 'CheckCircle', 'Users', 'Activity', 'Anchor', 'Aperture', 'Bike', 'Briefcase', 'Brush', 'Camera', 'Car', 'ClipboardCheck', 'Cloud', 'Code', 'Coffee', 'Compass', 'Cpu', 'CreditCard', 'Crown', 'Database', 'Diamond', 'Feather', 'Film', 'Flame', 'Flower', 'Gift', 'Globe', 'GraduationCap', 'Headphones', 'Home', 'Key', 'Laptop', 'Leaf', 'Lightbulb', 'Link', 'Map', 'Medal', 'Mic', 'Moon', 'MousePointer', 'Music', 'Paintbrush', 'Palette', 'PenTool', 'Phone', 'PieChart', 'Plane', 'Puzzle', 'Save', 'Scale', 'Scissors', 'Settings', 'Shield', 'ShoppingBag', 'Smile', 'Speaker', 'Sun', 'Sunrise', 'Sunset', 'Sword', 'Tag', 'Trophy', 'Truck', 'Umbrella', 'Video', 'Wallet', 'Watch', 'Wind', 'Wrench', 'Zap' ];
    const summarizedArticles = articlesData.map(a => ({ title: a.title, folder: a.kb_folders?.name }));
    const summarizedFolders = foldersData.map(f => f.name);
    console.log("[DIAGNOSTIC] buildContext: Data summarization complete.");

    return {
      projects: projectsData,
      users: usersData,
      goals: goalsData,
      allTags: allTagsData,
      articles: articlesData,
      folders: foldersData,
      summarizedProjects,
      summarizedGoals,
      userList,
      serviceList,
      iconList,
      summarizedArticles,
      summarizedFolders,
    };
  } catch (error) {
    console.error("[DIAGNOSTIC] buildContext: CRITICAL ERROR during context build:", error);
    throw error; // Re-throw to be caught by the main handler
  }
};