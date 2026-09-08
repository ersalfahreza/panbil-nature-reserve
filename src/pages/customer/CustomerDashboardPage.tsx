import { useAuth } from '@/features/auth/context/AuthContext';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { CalendarCheck, Ticket, MapPin, Star, ArrowRight, Plus } from 'lucide-react';

const stats = [
  { label: 'Reservasi Aktif', value: 0, icon: CalendarCheck, color: 'text-emerald-400' },
  { label: 'Tiket Valid', value: 0, icon: Ticket, color: 'text-emerald-400' },
  { label: 'Total Kunjungan', value: 0, icon: MapPin, color: 'text-emerald-400' },
  { label: 'Poin', value: 0, icon: Star, color: 'text-amber-400' },
];

const quickActions = [
  {
    label: 'Jelajahi Aktivitas',
    description: 'Temukan pengalaman seru di Panbil Nature Reserve',
    href: '/customer/activities',
    icon: Plus,
  },
  {
    label: 'Lihat Tiket',
    description: 'Kelola tiket dan reservasi Anda',
    href: '/customer/tickets',
    icon: Ticket,
  },
];

export default function CustomerDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl">
          Selamat datang, {user?.fullName}!
        </h1>
        <p className="mt-1 text-slate-400">
          Apa yang ingin Anda lakukan hari ini?
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={cn(
                'rounded-2xl border border-slate-800/50 bg-slate-900/50 backdrop-blur',
                'p-5 transition-colors hover:border-emerald-500/30'
              )}
            >
              <div className="flex items-center justify-between">
                <Icon className={cn('h-5 w-5', stat.color)} />
              </div>
              <p className="mt-3 text-2xl font-bold text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Reservasi Terbaru */}
      <div
        className={cn(
          'rounded-2xl border border-slate-800/50 bg-slate-900/50 backdrop-blur',
          'p-6'
        )}
      >
        <h2 className="text-lg font-semibold text-white">Reservasi Terbaru</h2>
        <div className="mt-6 flex flex-col items-center justify-center py-10 text-center">
          <CalendarCheck className="h-12 w-12 text-slate-600" />
          <p className="mt-4 text-slate-400">
            Belum ada reservasi. Mulai jelajahi aktivitas!
          </p>
          <Link
            to="/customer/activities"
            className={cn(
              'mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium',
              'bg-emerald-600 text-white transition-colors hover:bg-emerald-500'
            )}
          >
            <Plus className="h-4 w-4" />
            Jelajahi Aktivitas
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              to={action.href}
              className={cn(
                'group rounded-2xl border border-slate-800/50 bg-slate-900/50 backdrop-blur',
                'flex items-center justify-between p-5 transition-colors hover:border-emerald-500/30'
              )}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Icon className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{action.label}</p>
                  <p className="text-sm text-slate-400">{action.description}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-emerald-400" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
