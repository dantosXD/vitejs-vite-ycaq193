import { useEffect, useState } from 'react';
import { Fish, Loader2 } from 'lucide-react';
import { AuthTabs } from './components/auth/auth-tabs';
import { useAuth } from './lib/auth';
import { Toaster } from 'sonner';
import { DashboardLayout } from './components/dashboard/dashboard-layout';
import { initializeServices, isServicesInitialized } from './lib/appwrite';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { Button } from './components/ui/button';

export default function App() {
  const { user, checkAuth, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const init = async () => {
      if (isServicesInitialized()) {
        setIsInitializing(false);
        return;
      }
      try {
        setError(null);
        setIsInitializing(true);
        await initializeServices();
        await checkAuth();
      } catch (error: any) {
        const message = error?.message || 'Failed to initialize application. Please try again.';
        console.error('Initialization error:', message);
        setError(message);
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, [checkAuth, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle className="mb-2">Connection Error</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>{error}</p>
            <Button onClick={handleRetry} variant="outline" className="w-full">
              Retry Connection
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isInitializing || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Fish className="h-12 w-12 text-primary animate-pulse" />
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Initializing application...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!user ? (
        <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
          <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
            <div className="absolute inset-0 bg-zinc-900" />
            <div className="relative z-20 flex items-center text-lg font-medium">
              <Fish className="mr-2 h-6 w-6" />
              FishLog
            </div>
            <div className="relative z-20 mt-auto">
              <blockquote className="space-y-2">
                <p className="text-lg">
                  "The best fishing log app I've ever used. It helps me track my catches and connect with other anglers."
                </p>
                <footer className="text-sm">Sofia Davis</footer>
              </blockquote>
            </div>
          </div>
          <div className="lg:p-8">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
              <AuthTabs />
            </div>
          </div>
        </div>
      ) : (
        <DashboardLayout user={user} />
      )}
      <Toaster />
    </div>
  );
}