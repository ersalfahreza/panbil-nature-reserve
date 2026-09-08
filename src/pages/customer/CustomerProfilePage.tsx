import { useAuth } from '@/features/auth/context/AuthContext';
import { cn } from '@/lib/utils';
import { User, Mail, Phone, Shield } from 'lucide-react';

const roleBadgeMap: Record<string, { label: string; color: string }> = {
  customer: { label: 'Pelanggan', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  staff: { label: 'Staf', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  admin: { label: 'Admin', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
};

export default function CustomerProfilePage() {
  const { user } = useAuth();

  const badge = roleBadgeMap[user?.role ?? 'customer'] ?? roleBadgeMap.customer;

  const infoItems = [
    { label: 'Nama Lengkap', value: user?.fullName ?? '-', icon: User },
    { label: 'Email', value: user?.email ?? '-', icon: Mail },
    { label: 'Telepon', value: '-', icon: Phone },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white md:text-3xl">Profil Saya</h1>

      {/* Profile Card */}
      <div
        className={cn(
          'rounded-2xl border border-slate-800/50 bg-slate-900/50 backdrop-blur',
          'p-6'
        )}
      >
        {/* Avatar + Name */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <User className="h-8 w-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">
              {user?.fullName}
            </h2>
            <span
              className={cn(
                'mt-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-medium',
                badge.color
              )}
            >
              <Shield className="h-3 w-3" />
              {badge.label}
            </span>
          </div>
        </div>

        {/* Info List */}
        <div className="mt-6 divide-y divide-slate-800/50">
          {infoItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800/50">
                  <Icon className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-sm font-medium text-white">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Edit Button */}
        <div className="mt-6">
          <button
            disabled
            title="Segera hadir"
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium',
              'bg-slate-800 text-slate-500 cursor-not-allowed'
            )}
          >
            Edit Profil
          </button>
          <p className="mt-2 text-xs text-slate-600">Segera hadir</p>
        </div>
      </div>
    </div>
  );
}
