import { Project } from '@/types';
interface Props { projects: Project[]; groupBy: 'status' | 'payment_status' }
const ProjectKanban = ({ projects, groupBy }: Props) => <div>Tampilan Kanban Proyek ({projects.length} proyek, dikelompokkan berdasarkan {groupBy})</div>;
export default ProjectKanban;