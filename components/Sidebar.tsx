import Link from 'next/link';
import { Button } from './ui/button';
export interface IUserSessionData {
  id?: string;
  username?: string | null;
  email?: string | null;
  fullName?: string | null;
  name?: string | null; 
  image?: string | null; 
}

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  user?: IUserSessionData | null;
  currentPath: string;
}

const Sidebar = ({ isMobile, isOpen, onClose, onLogout, user, currentPath }: SidebarProps) => {
  const navItems = [
    { label: "Dashboard", icon: "tachometer-alt", href: "/dashboard" },
    { label: "My Widgets", icon: "th-large", href: "/widgets" },
    { label: "Reviews", icon: "star", href: "/reviews" },
    { label: "Settings", icon: "cog", href: "/settings" },
    { label: "Help & Support", icon: "question-circle", href: "/help" },
  ];

  if (isMobile && !isOpen) {
    return null;
  }

  const sidebarBaseStyles =
    "flex flex-col transition-all duration-300 ease-in-out shadow-lg bg-sidebar text-sidebar-foreground border-r border-sidebar-border";
  const sidebarClasses = isMobile
    ? `fixed inset-0 z-50 w-64 ${sidebarBaseStyles} ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
    : `w-64 fixed inset-y-0 z-30 hidden md:flex ${sidebarBaseStyles}`; 

  const userDisplayName = user?.fullName || user?.name || user?.username || "User";
  const userInitials = userDisplayName
    .split(' ')
    .map((name: string) => name[0])
    .slice(0, 2) 
    .join('')
    .toUpperCase() || 'U';

  return (
    <>
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        ></div>
      )}
      
      <aside className={sidebarClasses}>
        {isMobile && (
          <div className="absolute top-3 right-3">
            <button 
              onClick={onClose}
              className="text-sidebar-muted-foreground hover:text-sidebar-foreground p-1 rounded-md"
              aria-label="Close Sidebar"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        )}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-center h-16">
          <Link href="/dashboard" className="flex items-center group" >
              <span className="text-sidebar-primary text-2xl mr-2 group-hover:scale-110 transition-transform">
                <i className="fas fa-comment-dots"></i>
              </span>
              <h1 className="font-heading font-bold text-xl text-sidebar-foreground group-hover:text-sidebar-primary transition-colors">
                ReviewHub
              </h1>
          </Link>
        </div>
        <nav className="flex-1 pt-4 pb-4 overflow-y-auto space-y-1 px-2">
        {navItems.map((item) => {
          const isActive = currentPath === item.href || (item.href !== "/dashboard" && currentPath.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} onClick={isMobile ? onClose : undefined} className={isActive ? "sidebar-item-active" : "sidebar-item"}>
              <i className={`fas fa-${item.icon} w-5 h-5 text-center mr-3 flex-shrink-0 
                ${isActive ? "text-sidebar-primary" : "text-sidebar-muted-foreground group-hover:text-sidebar-foreground"}`}>
              </i>
              <span>{item.label}</span>
            </Link>
          );
      })}
        </nav>
        <div className="border-t border-sidebar-border p-4 mt-auto">
          {user && ( 
            <div className="flex items-center mb-3">
              <div className="w-9 h-9 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-sm font-semibold flex-shrink-0">
                <span>{userInitials}</span>
              </div>
              <div className="ml-3 min-w-0"> 
                <p className="text-sm font-semibold text-sidebar-foreground truncate" title={userDisplayName}>
                  {userDisplayName}
                </p>
                <p className="text-xs text-sidebar-muted-foreground truncate" title={user.email || ""}>
                  {user.email || 'No email'}
                </p>
              </div>
            </div>
          )}
          <Button
            variant="ghost" 
            onClick={onLogout}
            className="w-full flex items-center justify-start text-sidebar-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:hover:text-red-400 dark:hover:bg-red-900/30 px-3 py-2.5"
          >
            <i className="fas fa-sign-out-alt mr-3"></i> Logout
          </Button>
        </div>
      </aside>
    </>
  );
};
export default Sidebar;