// @ts-nocheck
export const ContextBuilder = {
  buildContext: async (supabaseClient, user) => {
    try {
      const [
        projectsRes,
        usersRes,
        goalsRes,
        allTagsRes,
        articlesRes,
        foldersRes
      ] = await Promise.all([
        supabaseClient.rpc('get_dashboard_projects', { p_limit: 1000, p_offset: 0 }),
        supabaseClient.from('profiles').select('id, first_name, last_name, email'),
        supabaseClient.rpc('get_user_goals'),
        supabaseClient.from('tags').select('id, name'),
        supabaseClient.from('kb_articles').select('id, title, slug, folder_id'),
        supabaseClient.from('kb_folders').select('id, name')
      ]);

      if (projectsRes.error) throw new Error(`Failed to fetch project data for analysis: ${projectsRes.error.message}`);
      if (usersRes.error) throw new Error(`Failed to fetch users for context: ${usersRes.error.message}`);
      if (goalsRes.error) throw new Error(`Failed to fetch goals for context: ${goalsRes.error.message}`);
      if (allTagsRes.error) throw new Error(`Failed to fetch tags for context: ${allTagsRes.error.message}`);
      if (articlesRes.error) throw new Error(`Failed to fetch articles for context: ${articlesRes.error.message}`);
      if (foldersRes.error) throw new Error(`Failed to fetch folders for context: ${foldersRes.error.message}`);

      const summarizedProjects = projectsRes.data.map(p => ({
          name: p.name,
          status: p.status,
          tags: (p.tags || []).map(t => t.name),
          tasks: (p.tasks || []).map(t => ({
              title: t.title,
              completed: t.completed,
              assignedTo: (t.assignedTo || []).map(a => a.name)
          }))
      }));
      const summarizedGoals = goalsRes.data.map(g => ({
          title: g.title,
          type: g.type,
          progress: g.completions ? g.completions.length : 0,
          tags: g.tags ? g.tags.map(t => t.name) : []
      }));
      const userList = usersRes.data.map(u => ({ id: u.id, name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email }));
      const serviceList = [ "3D Graphic Design", "Accommodation", "Award Ceremony", "Branding", "Content Creation", "Digital Marketing", "Entertainment", "Event Decoration", "Event Equipment", "Event Gamification", "Exhibition Booth", "Food & Beverage", "Keyvisual Graphic Design", "LED Display", "Lighting System", "Logistics", "Man Power", "Merchandise", "Motiongraphic Video", "Multimedia System", "Payment Advance", "Photo Documentation", "Plaque & Trophy", "Prints", "Professional Security", "Professional video production for commercial ads", "Show Management", "Slido", "Sound System", "Stage Production", "Talent", "Ticket Management System", "Transport", "Venue", "Video Documentation", "VIP Services", "Virtual Events", "Awards System", "Brand Ambassadors", "Electricity & Genset", "Event Consultation", "Workshop" ];
      const iconList = [ 'Target', 'Flag', 'BookOpen', 'Dumbbell', 'TrendingUp', 'Star', 'Heart', 'Rocket', 'DollarSign', 'FileText', 'ImageIcon', 'Award', 'BarChart', 'Calendar', 'CheckCircle', 'Users', 'Activity', 'Anchor', 'Aperture', 'Bike', 'Briefcase', 'Brush', 'Camera', 'Car', 'ClipboardCheck', 'Cloud', 'Code', 'Coffee', 'Compass', 'Cpu', 'CreditCard', 'Crown', 'Database', 'Diamond', 'Feather', 'Film', 'Flame', 'Flower', 'Gift', 'Globe', 'GraduationCap', 'Headphones', 'Home', 'Key', 'Laptop', 'Leaf', 'Lightbulb', 'Link', 'Map', 'Medal', 'Mic', 'Moon', 'MousePointer', 'Music', 'Paintbrush', 'Palette', 'PenTool', 'Phone', 'PieChart', 'Plane', 'Puzzle', 'Save', 'Scale', 'Scissors', 'Settings', 'Shield', 'ShoppingBag', 'Smile', 'Speaker', 'Sun', 'Sunrise', 'Sunset', 'Sword', 'Tag', 'Trophy', 'Truck', 'Umbrella', 'Video', 'Wallet', 'Watch', 'Wind', 'Wrench', 'Zap' ];
      const summarizedArticles = articlesRes.data.map(a => ({ title: a.title, folder: foldersRes.data.find(f => f.id === a.folder_id)?.name }));
      const summarizedFolders = foldersRes.data.map(f => f.name);

      return {
        projects: projectsRes.data,
        users: usersRes.data,
        goals: goalsRes.data,
        allTags: allTagsRes.data,
        articles: articlesRes.data,
        folders: foldersRes.data,
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
      throw error;
    }
  },
};