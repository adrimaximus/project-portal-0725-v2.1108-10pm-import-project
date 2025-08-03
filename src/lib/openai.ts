import { Goal } from '@/data/goals';

const positiveFeedback = [
  "You're doing an amazing job staying on track. Keep up the great momentum!",
  "Fantastic progress! Your consistency is really paying off.",
  "Excellent work! You're well on your way to achieving this goal.",
  "You're crushing it! Your dedication is clear from these results.",
];

const improvementTips = [
  {
    title: "Break It Down",
    tip: "Try breaking your goal into smaller, more manageable daily tasks. Ticking off small wins can build momentum."
  },
  {
    title: "Schedule It",
    tip: "Block out specific time in your calendar for your goal. Treat it like an important appointment."
  },
  {
    title: "Find Your 'Why'",
    tip: "Remind yourself of the reason you set this goal. Reconnecting with your motivation can be a powerful boost."
  },
  {
    title: "Adjust Your Strategy",
    tip: "What's one small thing you could change about your approach? Sometimes a minor tweak can make a big difference."
  },
  {
    title: "Use Reminders",
    tip: "Set up daily or weekly reminders on your phone or calendar to keep the goal top-of-mind."
  },
  {
    title: "Reward Yourself",
    tip: "Plan a small reward for when you hit a certain milestone. Positive reinforcement works!"
  }
];

const getRandomItems = <T>(arr: T[], num: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
};

// This function is updated to provide contextual feedback based on progress.
export const generateAiInsight = async (goal: Goal, progress: { percentage: number } | null): Promise<string> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const collaborators = goal.collaborators.map(c => c.name);
  let collaboratorText = "";
  if (collaborators.length > 0) {
    const collaboratorList = collaborators.join(' and ');
    collaboratorText = ` Don't forget to sync up with ${collaboratorList} to keep the teamwork flowing!`;
  }

  if (!progress || progress.percentage === null) {
    return `It looks like we're still gathering data for "${goal.title}". Keep logging your progress to get insights!${collaboratorText}`;
  }

  if (progress.percentage >= 60) {
    const feedback = getRandomItems(positiveFeedback, 1)[0];
    return `${feedback} You've hit ${progress.percentage}% of your target. ${collaboratorText}`;
  } else {
    const tips = getRandomItems(improvementTips, 3);
    const tipsText = tips.map(t => `\n\n**${t.title}:** ${t.tip}`).join('');
    return `It looks like you're at ${progress.percentage}% for "${goal.title}". Consistency is key! Here are a few tips to help you get back on track:${tipsText}${collaboratorText}`;
  }
};

// This is a mock function for generating icons, assuming it exists.
export const generateAiIcon = async (prompt: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const randomImageId = Math.floor(Math.random() * 1000);
    return `https://picsum.photos/id/${randomImageId}/100/100`;
};