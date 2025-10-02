import { Task } from '@/types';
interface Props { tasks: Task[]; isLoading: boolean; }
const ProjectTasksList = ({ tasks, isLoading }: Props) => {
  if (isLoading) return <div>Memuat tugas...</div>;
  return <div>Tampilan Daftar Tugas ({tasks.length} tugas)</div>;
};
export default ProjectTasksList;