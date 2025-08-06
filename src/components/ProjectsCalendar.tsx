import { Calendar, Badge } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { Project } from '@/data/projects';
import { Link } from 'react-router-dom';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

interface ProjectsCalendarProps {
  projects: Project[];
}

const ProjectsCalendar = ({ projects }: ProjectsCalendarProps) => {
  const getListData = (value: Dayjs) => {
    const listData = projects
      .filter(project => {
        if (!project.startDate || !project.dueDate) return false;
        const start = dayjs(project.startDate);
        const end = dayjs(project.dueDate);
        // '[]' menyertakan tanggal mulai dan selesai
        return value.isBetween(start, end, 'day', '[]');
      })
      .map(project => ({
        type: getStatusBadgeType(project.status),
        content: project.name,
        id: project.id,
      }));
    return listData || [];
  };

  const getStatusBadgeType = (status: Project['status']): 'success' | 'processing' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'On Track':
      case 'Completed':
      case 'Done':
      case 'Billed':
        return 'success';
      case 'In Progress':
      case 'Requested':
        return 'processing';
      case 'At Risk':
      case 'On Hold':
        return 'warning';
      case 'Off Track':
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    if (listData.length === 0) return null;

    return (
      <ul className="events space-y-1" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {listData.map(item => (
          <li key={item.id}>
            <Link to={`/projects/${item.id}`} className="block hover:bg-muted/50 rounded-sm px-1">
              <Badge status={item.type as any} text={item.content} className="text-xs truncate w-full" />
            </Link>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="h-[70vh] overflow-y-auto">
      <Calendar dateCellRender={dateCellRender} />
    </div>
  );
};

export default ProjectsCalendar;