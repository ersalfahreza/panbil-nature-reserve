import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Trees, LogIn, UserPlus } from 'lucide-react';

export default function RootLayout() {
  const { user, status } = useAuth();
  const navigate = useNavigate();

  function handleDashboardClick() {
    if (!user) return;
    switch (user.role) {
      case 'CUSTOMER':
        navigate('/dashboard');
        break;
      case 'STAFF':
        navigate('/staff');
        break;
      case 'ADMIN':
      case 'SUPER_ADMIN':
        navigate('/admin');
        break;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navigation */}
      <header className="sticky top-0 z-50 glass-panel">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20 transition-shadow group-hover:shadow-emerald-500/40">
              <Trees className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                Panbil
              </span>
              <span className="hidden sm:inline text-xs text-slate-400 ml-1.5">
                Nature Reserve
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm text-slate-300 hover:text-emerald-400 transition-colors"
            >
              Beranda
            </Link>
            <Link
              to="/activities"
              className="text-sm text-slate-300 hover:text-emerald-400 transition-colors"
            >
              Aktivitas
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {status === 'authenticated' && user ? (
              <button
                onClick={handleDashboardClick}
                className="flex items-center gap-2 rounded-lg bg-emerald-600/20 px-4 py-2 text-sm font-medium text-emerald-400 ring-1 ring-emerald-500/30 transition-all hover:bg-emerald-600/30 hover:ring-emerald-500/50"
              >
                <span className="hidden sm:inline">{user.fullName}</span>
                <span className="sm:hidden">Dashboard</span>
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-emerald-400"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Masuk</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/40 hover:from-emerald-500 hover:to-emerald-600"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Daftar</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-950 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-2">
              <Trees className="h-5 w-5 text-emerald-500" />
              <span className="font-bold text-slate-200">
                Panbil Nature Reserve
              </span>
            </div>
            <p className="max-w-md text-sm text-slate-500">
              Destinasi ecotourism premium di Batam. Nikmati Edu Park, Eco
              Park, Hiking, Paintball, dan ATV dalam keasrian alam tropis.
            </p>
            <p className="text-xs text-slate-600">
              &copy; {new Date().getFullYear()} Panbil Nature Reserve. All
              rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
