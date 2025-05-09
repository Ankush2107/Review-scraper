import { useEffect, useState } from "react";
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import Sidebar from "./Sidebar";
import { useToast } from "../hooks/use-toast";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

interface IUserSessionData {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  id?: string; 
  username?: string;
  fullName?: string; 
}

const Layout = ({ children }: LayoutProps) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const router = useRouter();
  const { data: session, status: authStatus } = useSession(); // Get session data
  const { toast } = useToast();

  const userForDisplay: IUserSessionData | undefined = session?.user;

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.push("/login"); 
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };


  if (authStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background transition-theme">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground dark:text-muted-foreground transition-theme">Loading Application...</p>
        </div>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
   useEffect(() => {
       router.push("/login");
   }, [router]);
   return null; 
  }

  const getPageTitle = () => {
    switch (router.pathname) {
      case "/dashboard": return "Dashboard";
      case "/widgets": return "My Widgets";
      case "/reviews": return "Manage Reviews";
      case "/settings": return "Settings";
      default:
        // Attempt to create a title from the path
        const pathParts = router.pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) {
          const lastPart = pathParts[pathParts.length - 1];
          return lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/-/g, ' ');
        }
        return "ReviewHub";
    }
  };

  const userInitials = (userForDisplay?.fullName || userForDisplay?.name || userForDisplay?.username || 'U').charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (Desktop) */}
      <Sidebar 
        isMobile={false} 
        onClose={() => {}} 
        onLogout={handleLogout}
        user={userForDisplay}
        currentPath={router.pathname}
      />

      {/* Sidebar (Mobile) */}
      <Sidebar 
        isMobile={true} 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
        onLogout={handleLogout}
        user={userForDisplay} 
        currentPath={router.pathname}
      />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 relative bg-background dark:bg-gray-950 transition-colors duration-300">
        {/* Mobile Header */}
        <header className="bg-card dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm py-3 px-4 md:hidden sticky top-0 z-40 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="text-muted-foreground hover:text-foreground mr-2"
                aria-label="Open sidebar"
              >
                <i className="fas fa-bars text-lg"></i>
              </Button>
              <div className="flex items-center">
                <span className="text-primary text-2xl mr-2">
                  <i className="fas fa-comment-dots"></i>
                </span>
                <h1 className="font-heading font-bold text-lg text-foreground dark:text-white">ReviewHub</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              {userForDisplay && (
                <div className="h-8 w-8 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center text-primary dark:text-primary-foreground text-sm font-semibold">
                  {userInitials}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Top Navigation Bar (Desktop) */}
        <header className="hidden md:flex items-center justify-between bg-card dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm py-3 px-6 sticky top-0 z-30 transition-colors duration-300">
          <h2 className="text-xl font-heading font-semibold text-foreground dark:text-white">
            {getPageTitle()}
          </h2>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative" aria-label="Notifications">
              <i className="fas fa-bell text-lg"></i>
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive animate-pulse"></span>
            </Button>
            <ThemeToggle />
              {userForDisplay && ( 
                <div className="h-9 w-9 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center text-primary dark:text-primary-foreground text-base font-semibold cursor-pointer" title={userForDisplay.name || userForDisplay.email || ""}>
                  {userInitials}
                </div>
              )}
          </div>
        </header>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
