import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Halaman Utama</h1>
      <Link to="/projects" className="text-blue-500 underline">Pergi ke Proyek</Link>
    </div>
  );
};

export default Index;