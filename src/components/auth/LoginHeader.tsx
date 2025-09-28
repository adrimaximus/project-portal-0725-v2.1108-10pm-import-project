import { Package } from 'lucide-react';

interface LoginHeaderProps {
  lastUserName: string | null;
}

const LoginHeader = ({ lastUserName }: LoginHeaderProps) => {
  return (
    <>
      <div className="flex items-center gap-2 mb-8">
        <Package className="h-7 w-7 text-white" />
        <span className="text-xl font-bold text-white">Client Portal</span>
      </div>
      <h1 className="text-3xl font-serif font-bold mb-2 text-white">
        Welcome Back{lastUserName ? `, ${lastUserName}` : ''}!👋
      </h1>
      <p className="text-white/80 mb-8">Sign in or create an account to access your portal.</p>
    </>
  );
};

export default LoginHeader;