import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Leaf,
  Mountain,
  Target,
  Car,
  Clock,
  Users,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getActiveActivities,
} from '@/features/activities/services/activity.service';
import type { ActivityListItem } from '@/features/activities/types/activity.types';

const categoryColors: Record<string, string> = {
  Edukasi: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  Alam: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  Petualangan: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  Trekking: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  Tim: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  Ekstrem: 'bg-red-500/10 text-red-400 border-red-500/30',
  'Adventure Sports': 'bg-red-500/10 text-red-400 border-red-500/30',
};

function getActivityIcon(slug: string) {
  switch (slug) {
    case 'edu-park':
      return GraduationCap;
    case 'eco-park':
      return Leaf;
    case 'hiking':
    case 'hiking-trail':
      return Mountain;
    case 'paintball':
      return Target;
    case 'atv':
    case 'atv-adventure':
      return Car;
    default:
      return Leaf;
  }
}

function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} menit`;
  }

  const hours = minutes / 60;

  if (Number.isInteger(hours)) {
    return `${hours} jam`;
  }

  const wholeHours = Math.floor(hours);
  const remainingMinutes = minutes % 60;

  return `${wholeHours} jam ${remainingMinutes} menit`;
}

function formatCapacity(maxParticipants: number) {
  return `Maks. ${maxParticipants} orang/sesi`;
}

function getActivityPrice(activity: ActivityListItem) {
  return activity.current_price?.price ?? 0;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ActivityListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadActivities() {
      try {
        setLoading(true);
        setError(null);

        const data = await getActiveActivities();

        if (mounted) {
          setActivities(data);
        }
      } catch (err) {
        console.error('GET ACTIVITIES ERROR:', err);

        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Gagal memuat aktivitas.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadActivities();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-900" />

        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-10 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-sky-400 bg-clip-text text-transparent">
                Aktivitas Kami
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Temukan beragam aktivitas ekowisata premium yang dirancang untuk
              memberikan pengalaman tak terlupakan di Panbil Nature Reserve,
              Batam.
            </p>
          </div>
        </div>
      </section>

      {/* Activities Grid */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Loading */}
          {loading && (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex items-center gap-3 text-emerald-400">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Memuat aktivitas...</span>
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="mx-auto max-w-xl rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
              <p className="font-semibold text-red-400">
                Gagal memuat aktivitas
              </p>

              <p className="mt-2 text-sm text-slate-400">
                {error}
              </p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-5 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && activities.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
              <p className="text-lg font-semibold text-white">
                Belum ada aktivitas tersedia
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Silakan kembali lagi nanti untuk melihat aktivitas yang tersedia.
              </p>
            </div>
          )}

          {/* Activities */}
          {!loading && !error && activities.length > 0 && (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {activities.map((activity) => {
                const Icon = getActivityIcon(activity.slug);
                const category = activity.category.name;
                const price = getActivityPrice(activity);

                return (
                  <div
                    key={activity.id}
                    className={cn(
                      'group flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm',
                      'transition-all duration-300 hover:border-emerald-500/30 hover:bg-slate-800/60',
                      'hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5'
                    )}
                  >
                    {/* Card Header */}
                    <div className="p-6 pb-0">
                      <div className="flex items-start justify-between">
                        <div className="inline-flex rounded-xl bg-emerald-500/10 p-3 text-emerald-400 transition-colors group-hover:bg-emerald-500/20">
                          <Icon className="h-7 w-7" />
                        </div>

                        <span
                          className={cn(
                            'rounded-full border px-3 py-1 text-xs font-medium',
                            categoryColors[category] ||
                              'bg-slate-500/10 text-slate-400 border-slate-500/30'
                          )}
                        >
                          {category}
                        </span>
                      </div>

                      <h3 className="mt-4 text-xl font-bold text-white transition-colors group-hover:text-emerald-400">
                        {activity.name}
                      </h3>

                      <p className="mt-2 text-sm leading-relaxed text-slate-400">
                        {activity.description}
                      </p>
                    </div>

                    {/* Card Info */}
                    <div className="mt-auto p-6">
                      <div className="mb-4 flex flex-wrap gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-emerald-500/70" />
                          <span>
                            {formatDuration(activity.duration_minutes)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-emerald-500/70" />
                          <span>
                            {formatCapacity(activity.max_participants)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-end justify-between border-t border-slate-800 pt-4">
                        <div>
                          <span className="text-xs text-slate-500">
                            Mulai dari
                          </span>

                          <p className="text-2xl font-bold text-emerald-400">
                            Rp {price.toLocaleString('id-ID')}
                          </p>
                        </div>

                        <Link
                          to={`/activities/${activity.slug}`}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-400',
                            'transition-all hover:bg-emerald-500/20 hover:text-emerald-300'
                          )}
                        >
                          Lihat Detail

                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Information */}
          {!loading && !error && activities.length > 0 && (
            <div className="mt-16 rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center backdrop-blur-sm">
              <p className="text-sm text-slate-500">
                Data aktivitas ditampilkan langsung dari katalog Panbil
                Nature Reserve.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}