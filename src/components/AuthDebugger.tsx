import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

// Add global debug function
declare global {
  interface Window {
    debugAuth: () => Promise<void>;
  }
}

const AuthDebugger = () => {
  const [debugData, setDebugData] = useState<any>({});
  const [isChecking, setIsChecking] = useState(false);

  // Check if in private/incognito mode
  const checkPrivateMode = async (): Promise<boolean> => {
    try {
      // Try to use indexedDB - blocked in private mode
      const db = indexedDB.open('test');
      return new Promise((resolve) => {
        db.onsuccess = () => resolve(false);
        db.onerror = () => resolve(true);
      });
    } catch {
      return true;
    }
  };

  // Check third-party cookies
  const checkThirdPartyCookies = async (): Promise<string> => {
    try {
      // Try to set a cookie and read it back
      document.cookie = "test_cookie=1; SameSite=None; Secure";
      const canSetCookie = document.cookie.includes('test_cookie=1');
      document.cookie = "test_cookie=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      return canSetCookie ? 'enabled' : 'blocked';
    } catch {
      return 'error';
    }
  };

  const runDiagnostics = async () => {
    setIsChecking(true);
    const results: any = {};

    try {
      // Environment info
      results.environment = {
        hostname: window.location.hostname,
        origin: window.location.origin,
        isLocalhost: window.location.hostname === 'localhost',
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        userAgent: navigator.userAgent,
        cookiesEnabled: navigator.cookieEnabled,
        isArcBrowser: navigator.userAgent.includes('Arc'),
      };

      // Check storage access
      try {
        localStorage.setItem('auth_debug_test', '1');
        localStorage.removeItem('auth_debug_test');
        results.localStorage = { accessible: true };
      } catch (e: any) {
        results.localStorage = { accessible: false, error: e.message };
      }

      try {
        sessionStorage.setItem('auth_debug_test', '1');
        sessionStorage.removeItem('auth_debug_test');
        results.sessionStorage = { accessible: true };
      } catch (e: any) {
        results.sessionStorage = { accessible: false, error: e.message };
      }

      // Check cookies
      try {
        document.cookie = "test_cookie=1; SameSite=None; Secure";
        const canSetCookie = document.cookie.includes('test_cookie=1');
        document.cookie = "test_cookie=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        results.cookies = { canSet: canSetCookie };
      } catch (e: any) {
        results.cookies = { canSet: false, error: e.message };
      }

      // 1. Check current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      results.session = {
        exists: !!sessionData.session,
        error: sessionError?.message,
        userEmail: sessionData.session?.user?.email,
        userId: sessionData.session?.user?.id,
        accessToken: sessionData.session?.access_token ? 'present' : 'missing',
        refreshToken: sessionData.session?.refresh_token ? 'present' : 'missing',
        expiresAt: sessionData.session?.expires_at,
        expiresIn: sessionData.session?.expires_in,
      };

      // 2. Check current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      results.user = {
        exists: !!userData.user,
        error: userError?.message,
        email: userData.user?.email,
        id: userData.user?.id,
        emailConfirmed: userData.user?.email_confirmed_at ? 'yes' : 'no',
        lastSignIn: userData.user?.last_sign_in_at,
      };

      // 3. Try to fetch profile if user exists
      if (userData.user) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userData.user.id)
            .single();
          
          results.profile = {
            exists: !!profileData,
            error: profileError?.message,
            errorCode: profileError?.code,
            data: profileData,
          };
        } catch (e: any) {
          results.profile = {
            exists: false,
            error: e.message,
          };
        }

        // 4. Test basic table access
        try {
          const { data: testData, error: testError } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);
          
          results.tableAccess = {
            works: !testError,
            error: testError?.message,
            errorCode: testError?.code,
          };
        } catch (e: any) {
          results.tableAccess = {
            works: false,
            error: e.message,
          };
        }
      }

      // 5. Check auth state listeners
      results.authListeners = {
        hasListeners: supabase.auth.getSession !== undefined,
      };

      // 6. Check browser-specific issues
      results.browserChecks = {
        isArc: navigator.userAgent.includes('Arc'),
        isPrivateMode: await checkPrivateMode(),
        thirdPartyCookies: await checkThirdPartyCookies(),
      };

      setDebugData(results);
    } catch (error: any) {
      results.generalError = error.message;
      setDebugData(results);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
    
    // Add global debug function
    window.debugAuth = async () => {
      console.log('=== AUTH DEBUG ===');
      
      // Check current session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session);
      
      // Check cookies
      console.log('Cookies enabled:', navigator.cookieEnabled);
      console.log('Document cookies:', document.cookie);
      
      // Check localStorage
      try {
        localStorage.setItem('test', '1');
        localStorage.removeItem('test');
        console.log('localStorage: OK');
      } catch(e) {
        console.log('localStorage: BLOCKED', e);
      }
      
      // Check if in private mode
      const isPrivate = await checkPrivateMode();
      console.log('Private mode:', isPrivate);
      
      // Check Supabase client state
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'present' : 'missing');
      
      console.log('=== END DEBUG ===');
    };

    return () => {
      delete window.debugAuth;
    };
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Authentication Diagnostics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDiagnostics} disabled={isChecking}>
          {isChecking ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </Button>
        
        <div className="bg-gray-100 p-4 rounded-md">
          <pre className="text-xs overflow-auto max-h-96">
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </div>
        
        {debugData.environment && (
          <div className="text-sm space-y-2">
            <p><strong>Quick Fix:</strong></p>
            <p>Add this URL to your Supabase Auth settings:</p>
            <code className="bg-gray-200 p-2 rounded block">
              {debugData.environment.origin}/auth/callback
            </code>
            
            {debugData.browserChecks?.isArc && (
              <div className="mt-4 p-3 bg-yellow-100 rounded">
                <p><strong>Arc Browser Detected:</strong></p>
                <p>Arc browser sometimes blocks third-party cookies. Try:</p>
                <ul className="list-disc ml-4 mt-2">
                  <li>Disable "Block Trackers" for this site</li>
                  <li>Allow cookies in Arc settings</li>
                  <li>Try in a different browser</li>
                </ul>
              </div>
            )}
            
            {debugData.browserChecks?.isPrivateMode && (
              <div className="mt-4 p-3 bg-red-100 rounded">
                <p><strong>Private Mode Detected:</strong></p>
                <p>Private/Incognito mode may block authentication. Try in normal mode.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthDebugger;