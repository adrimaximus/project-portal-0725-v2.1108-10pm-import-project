import { Project } from '@/types';
interface Props { projects: Project[] }
const ProjectList = ({ projects }: Props) => <div>Tampilan Daftar Proyek ({projects.length} proyek)</div>;
export default ProjectList;