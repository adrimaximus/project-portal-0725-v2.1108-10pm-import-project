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
import BrowserCompatibilityCheck from '@/components/auth/BrowserCompatibilityCheck';
import AuthLoadingScreen from '@/components/auth/AuthLoadingScreen';
import { useLoginHandlers } from '@/hooks/useLoginHandlers';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { useBrowserDetection } from '@/hooks/useBrowserDetection';

const LoginPage = () => {
  const { session, loading: authContextLoading, error: authError } = useAuth();
  const [lastUserName, setLastUserName] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showDebugger, setShowDebugger] = useState(false);
  const [showAuthTest, setShowAuthTest] = useState(false);
  const [error, setError] = useState('');
  const [showCompatibilityCheck, setShowCompatibilityCheck] = useState(false);

  const { browserInfo } = useBrowserDetection();
  const { isRedirecting } = useAuthRedirect({ 
    requireAuth: true, 
    isArcBrowser: browserInfo.isArc 
  });

  const {
    forceRefreshCount,
    handleForceRefresh,
    handleArcBrowserFix,
    handleNavigateToDashboard,
    handleLoginSuccess,
  } = useLoginHandlers(browserInfo.isArc);

  useEffect(() => {
    const storedName = localStorage.getItem('lastUserName');
    if (storedName) {
      setLastUserName(storedName);
    }
  }, []);

  // Show loading screen while redirecting
  if (isRedirecting) {
    return <AuthLoadingScreen />;
  }

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
            
            <BrowserCompatibilityCheck 
              onDismiss={() => setShowCompatibilityCheck(false)}
              showDetails={showCompatibilityCheck}
            />
            
            <BrowserWarnings isArcBrowser={browserInfo.isArc} error={error || authError || ''} />
            
            <AuthDebugPanel
              authContextLoading={authContextLoading}
              session={session}
              forceRefreshCount={forceRefreshCount}
              debugInfo={debugInfo}
              isArcBrowser={browserInfo.isArc}
              onForceRefresh={handleForceRefresh}
              onArcBrowserFix={handleArcBrowserFix}
              onShowDebugger={() => setShowDebugger(true)}
              onShowAuthTest={() => setShowAuthTest(true)}
              onNavigateToDashboard={handleNavigateToDashboard}
            />
            
            <AuthTabs
              isArcBrowser={browserInfo.isArc}
              onLoginSuccess={handleLoginSuccess}
              onDebugUpdate={setDebugInfo}
              onError={setError}
            />

            {/* Additional debug options */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <Button 
                variant="link" 
                size="sm" 
                className="text-white/60 hover:text-white/80 p-0"
                onClick={() => setShowCompatibilityCheck(!showCompatibilityCheck)}
              >
                {showCompatibilityCheck ? 'Hide' : 'Show'} Browser Compatibility
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;