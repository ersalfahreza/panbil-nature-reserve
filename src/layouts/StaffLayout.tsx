import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { logout } from '@/features/auth/services/auth.service';
import { Trees, ScanLine, LayoutDashboard, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/staff', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/staff/check-in', label: 'Check-in', icon: ScanLine },
];

export default function StaffLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-800/50 bg-slate-900/80 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-800/50 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-sky-700">
            <Trees className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-200">
              Staff Portal
            </span>
            <p className="text-[10px] text-slate-500">Panbil Nature Reserve</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200',
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800/50 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-600 to-sky-800 text-sm font-bold text-white">
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-slate-200">
                {user?.fullName}
              </p>
              <p className="text-xs text-sky-400/70">Staff</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-800/50 bg-slate-900/90 px-4 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2">
          <Trees className="h-5 w-5 text-sky-500" />
          <span className="text-sm font-bold text-slate-200">
            Staff Portal
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg p-2 text-slate-400 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      <main className="flex-1 pt-14 lg:pl-64 lg:pt-0">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-slate-800/50 bg-slate-900/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] transition-colors',
                isActive
                  ? 'text-sky-400'
                  : 'text-slate-500 hover:text-slate-300',
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
