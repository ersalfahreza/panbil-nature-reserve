import { useAuth } from '@/features/auth/context/AuthContext';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { ScanLine, Users, CalendarDays, ArrowRight } from 'lucide-react';

const stats = [
  { label: 'Check-in Hari Ini', value: 0, icon: ScanLine },
  { label: 'Total Pengunjung', value: 0, icon: Users },
];

export default function StaffDashboardPage() {
  const { user } = useAuth();

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl">
          Selamat datang, {user?.fullName}!
        </h1>
        <div className="mt-2 flex items-center gap-2 text-slate-400">
          <CalendarDays className="h-4 w-4 text-sky-400" />
          <span className="text-sm">{today}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={cn(
                'rounded-2xl border border-slate-800/50 bg-slate-900/50 backdrop-blur',
                'p-5 transition-colors hover:border-sky-500/30'
              )}
            >
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-sky-400" />
              </div>
              <p className="mt-3 text-2xl font-bold text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Action */}
      <Link
        to="/staff/check-in"
        className={cn(
          'group flex items-center justify-between rounded-2xl border border-slate-800/50 bg-slate-900/50 backdrop-blur',
          'p-5 transition-colors hover:border-sky-500/30'
        )}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10">
            <ScanLine className="h-6 w-6 text-sky-400" />
          </div>
          <div>
            <p className="font-medium text-white">Mulai Check-in</p>
            <p className="text-sm text-slate-400">
              Scan tiket pengunjung untuk check-in
            </p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-sky-400" />
      </Link>
    </div>
  );
}
