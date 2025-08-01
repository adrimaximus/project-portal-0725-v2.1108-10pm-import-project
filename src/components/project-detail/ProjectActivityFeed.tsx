import { Activity } from '@/data/projects';

const ProjectActivityFeed = ({ activities }: { activities: Activity[] }) => {
  return (
    <div>
      <h3 className="font-bold">Activity</h3>
      <ul>
        {activities?.map(activity => (
          <li key={activity.id}>{activity.user.name} {activity.action} {activity.target}</li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectActivityFeed;