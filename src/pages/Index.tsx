import { Link } from 'react-router-dom';

export default function Index() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold">Home Page</h1>
      <p className="mt-4">
        Navigate to the{' '}
        <Link to="/people-demo" className="text-blue-600 hover:underline">
          People Demo page
        </Link>{' '}
        to see the new feature.
      </p>
    </div>
  );
}