import Link from 'next/link';
import { Button } from './ui/button';
import { useTheme } from 'next-themes';

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
  const { resolvedTheme } = useTheme();
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
  const isDark = resolvedTheme === 'dark';
   const sidebarBackgroundColor = isDark ? 'bg-gray-800' : 'bg-slate-50'; 
  const sidebarTextColor = isDark ? 'text-gray-200' : 'text-slate-700';
  const sidebarBorderColor = isDark ? 'border-gray-700' : 'border-slate-200';

  const logoTextColor = isDark ? 'text-white group-hover:text-primary' : 'text-foreground group-hover:text-primary';
  const logoIconColor = isDark ? 'text-primary' : 'text-primary'; 

  const navItemBase = "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 group";
  const navItemInactive = `hover:bg-muted/50 dark:hover:bg-gray-700 ${isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`;

  const navItemActive = `${isDark ? 'bg-primary/20 text-primary-foreground' : 'bg-primary/10 text-primary'}`; 

  const navIconInactive = `${isDark ? 'text-gray-500 group-hover:text-gray-300' : 'text-slate-500 group-hover:text-slate-700'}`;
  const navIconActive = `${isDark ? 'text-primary-foreground/90' : 'text-primary'}`;

  const userAvatarBg = isDark ? 'bg-primary/30' : 'bg-primary/20';
  const userAvatarText = isDark ? 'text-primary-foreground' : 'text-primary';
  const userNameText = isDark ? 'text-white' : 'text-foreground';
  const userEmailText = isDark ? 'text-gray-400' : 'text-muted-foreground';

  const logoutButtonText = isDark ? 'text-gray-400 hover:text-red-400' : 'text-muted-foreground hover:text-destructive';
  const logoutButtonBgHover = isDark ? 'hover:bg-red-900/30' : 'hover:bg-destructive/10';


  const sidebarBaseStyles = `flex flex-col transition-all duration-300 ease-in-out shadow-lg border-r ${sidebarBackgroundColor} ${sidebarTextColor} ${sidebarBorderColor}`;

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
              type="button"
              onClick={onClose}
              className={`p-1 rounded-md ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-muted-foreground hover:text-foreground'}`}
              aria-label="Close Sidebar"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        )}
        <div className={`p-4 border-b flex items-center justify-center h-16 ${sidebarBorderColor}`}>
          <Link href="/dashboard" className="flex items-center group" >
              <span className={`text-2xl mr-2 group-hover:scale-110 transition-transform ${logoIconColor}`}>
                <i className="fas fa-comment-dots"></i>
              </span>
              <h1 className={`font-heading font-bold text-xl transition-colors ${logoTextColor}`}>
                ReviewHub
              </h1>
          </Link>
        </div>
        <nav className="flex-1 pt-4 pb-4 overflow-y-auto space-y-1 px-2">
        {navItems.map((item) => {
          const isActive = currentPath === item.href || (item.href !== "/dashboard" && currentPath.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} onClick={isMobile ? onClose : undefined} className={`${navItemBase} ${isActive ? navItemActive : navItemInactive}`}>
              <i className={`fas fa-${item.icon} w-5 h-5 text-center mr-3 flex-shrink-0 ${isActive ? navIconActive : navIconInactive}`}>
              </i>
              <span>{item.label}</span>
            </Link>
          );
      })}
        </nav>
        <div className={`border-t p-4 mt-auto ${sidebarBorderColor}`}>
          {user && ( 
            <div className="flex items-center mb-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${userAvatarBg} ${userAvatarText}`}>
                <span>{userInitials}</span>
              </div>
              <div className="ml-3 min-w-0"> 
                <p className={`text-sm font-semibold truncate ${userNameText}`} title={userDisplayName}>
                  {userDisplayName}
                </p>
                <p className={`text-xs truncate ${userEmailText}`} title={user.email || ""}>
                  {user.email || 'No email'}
                </p>
              </div>
            </div>
          )}
          <Button
            variant="ghost" 
            onClick={onLogout}
            className={`w-full flex items-center justify-start px-3 py-2.5 ${logoutButtonText} ${logoutButtonBgHover}`}
          >
            <i className="fas fa-sign-out-alt mr-3"></i> Logout
          </Button>
        </div>
      </aside>
    </>
  );
};
export default Sidebar;