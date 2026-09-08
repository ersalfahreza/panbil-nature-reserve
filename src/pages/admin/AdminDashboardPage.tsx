import { useAuth } from '@/features/auth/context/AuthContext';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  DollarSign,
  Activity,
  Users,
  ScanLine,
  BadgePercent,
  ArrowRight,
} from 'lucide-react';

const stats = [
  { label: 'Total Reservasi', value: 0, icon: BarChart3 },
  { label: 'Pendapatan', value: 'Rp 0', icon: DollarSign },
  { label: 'Aktivitas Aktif', value: 0, icon: Activity },
  { label: 'Pelanggan', value: 0, icon: Users },
  { label: 'Check-in Hari Ini', value: 0, icon: ScanLine },
  { label: 'Promo Aktif', value: 0, icon: BadgePercent },
];

const quickAccess = [
  {
    label: 'Kelola Aktivitas',
    href: '/admin/activities',
    icon: Activity,
  },
  {
    label: 'Kelola Jadwal',
    href: '/admin/schedules',
    icon: BarChart3,
  },
  {
    label: 'Kelola Reservasi',
    href: '/admin/bookings',
    icon: BarChart3,
  },
  {
    label: 'Laporan',
    href: '/admin/reports',
    icon: BarChart3,
  },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            Selamat datang, {user?.fullName}!
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-medium',
                'border-amber-500/20 bg-amber-500/10 text-amber-400'
              )}
            >
              Administrator
            </span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={cn(
                'rounded-2xl border border-slate-800/50 bg-slate-900/50 backdrop-blur',
                'p-5 transition-colors hover:border-amber-500/30'
              )}
            >
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-amber-400" />
              </div>
              <p className="mt-3 text-2xl font-bold text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Akses Cepat</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {quickAccess.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  'group flex items-center justify-between rounded-2xl border border-slate-800/50 bg-slate-900/50 backdrop-blur',
                  'p-5 transition-colors hover:border-amber-500/30'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                    <Icon className="h-5 w-5 text-amber-400" />
                  </div>
                  <p className="font-medium text-white">{item.label}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-amber-400" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
