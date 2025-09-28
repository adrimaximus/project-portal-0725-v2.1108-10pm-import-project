import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import AuthDebugger from '@/components/AuthDebugger';
import AuthTest from '@/components/AuthTest';
import LoginLeftPanel from '@/components/auth/LoginLeftPanel';
import LoginHeader from '@/components/auth/LoginHeader';
import BrowserWarnings from '@/components/auth/BrowserWarnings';
import AuthDebugPanel from '@/components/auth/AuthDebugPanel';
import AuthTabs from '@/components/auth/AuthTabs';
import { useLoginHandlers } from '@/hooks/useLoginHandlers';

const LoginPage = () => {
  const { session, loading: authContextLoading } = useAuth();
  const navigate = useNavigate();
  const [lastUserName, setLastUserName] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showDebugger, setShowDebugger] = useState(false);
  const [showAuthTest, setShowAuthTest] = useState(false);
  const [isArcBrowser, setIsArcBrowser] = useState(false);
  const [error, setError] = useState('');

  const {
    forceRefreshCount,
    handleForceRefresh,
    handleArcBrowserFix,
    handleNavigateToDashboard,
    handleLoginSuccess,
  } = useLoginHandlers(isArcBrowser);

  useEffect(() => {
    const storedName = localStorage.getItem('lastUserName');
    if (storedName) {
      setLastUserName(storedName);
    }
    
    // Detect Arc browser
    setIsArcBrowser(navigator.userAgent.includes('Arc'));
  }, []);

  useEffect(() => {
    console.log('LoginPage: Auth context loading:', authContextLoading, 'Session:', !!session);
    
    if (authContextLoading) return;

    if (session) {
      console.log('LoginPage: Session found, redirecting to dashboard');
      // For Arc browser, use hard redirect
      if (isArcBrowser) {
        window.location.href = '/dashboard';
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [session, authContextLoading, navigate, isArcBrowser]);

  if (showDebugger) {
    return (
      <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="mb-4">
            <Button onClick={() => setShowDebugger(false)} variant="outline" className="text-white border-white/20">
              Back to Login
            </Button>
          </div>
          <AuthDebugger />
        </div>
      </div>
    );
  }

  if (showAuthTest) {
    return (
      <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="mb-4">
            <Button onClick={() => setShowAuthTest(false)} variant="outline" className="text-white border-white/20">
              Back to Login
            </Button>
          </div>
          <AuthTest />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center p-4 bg-cover bg-center" style={{backgroundImage: "url('https://images.unsplash.com/photo-1554147090-e1221a04a025?q=80&w=2940&auto=format&fit=crop')"}}>
      <div className="w-full max-w-4xl grid lg:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl">
        <LoginLeftPanel />

        {/* Right Panel */}
        <div className="bg-black/50 backdrop-blur-md p-8 sm:p-12 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">
            <LoginHeader lastUserName={lastUserName} />
            
            <BrowserWarnings isArcBrowser={isArcBrowser} error={error} />
            
            <AuthDebugPanel
              authContextLoading={authContextLoading}
              session={session}
              forceRefreshCount={forceRefreshCount}
              debugInfo={debugInfo}
              isArcBrowser={isArcBrowser}
              onForceRefresh={handleForceRefresh}
              onArcBrowserFix={handleArcBrowserFix}
              onShowDebugger={() => setShowDebugger(true)}
              onShowAuthTest={() => setShowAuthTest(true)}
              onNavigateToDashboard={handleNavigateToDashboard}
            />
            
            <AuthTabs
              isArcBrowser={isArcBrowser}
              onLoginSuccess={handleLoginSuccess}
              onDebugUpdate={setDebugInfo}
              onError={setError}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;