import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import MagicLinkForm from '@/components/MagicLinkForm';

interface AuthTabsProps {
  isArcBrowser: boolean;
  onLoginSuccess: () => void;
  onDebugUpdate: (info: string) => void;
  onError: (error: string) => void;
}

const AuthTabs = ({ isArcBrowser, onLoginSuccess, onDebugUpdate, onError }: AuthTabsProps) => {
  return (
    <Tabs defaultValue="password" className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
        <TabsTrigger value="password" className="text-gray-400 data-[state=active]:bg-gray-700/50 data-[state=active]:text-white">
          Password
        </TabsTrigger>
        <TabsTrigger value="magic-link" className="text-gray-400 data-[state=active]:bg-gray-700/50 data-[state=active]:text-white">
          Magic Link
        </TabsTrigger>
        <TabsTrigger value="signup" className="text-gray-400 data-[state=active]:bg-gray-700/50 data-[state=active]:text-white">
          Sign Up
        </TabsTrigger>
      </TabsList>
      <TabsContent value="password" className="pt-6">
        <LoginForm 
          onSuccess={onLoginSuccess}
          isArcBrowser={isArcBrowser}
          onDebugUpdate={onDebugUpdate}
          onError={onError}
        />
      </TabsContent>
      <TabsContent value="magic-link" className="pt-6">
        <MagicLinkForm />
      </TabsContent>
      <TabsContent value="signup" className="pt-6">
        <SignUpForm isArcBrowser={isArcBrowser} />
      </TabsContent>
    </Tabs>
  );
};

export default AuthTabs;