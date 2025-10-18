import { Loader2 } from 'lucide-react';

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <Loader2 className="h-12 w-12 text-white animate-spin" />
    </div>
  );
};

export default LoadingSpinner;