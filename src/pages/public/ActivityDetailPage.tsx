import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Car,
  CheckCircle2,
  Clock,
  GraduationCap,
  Leaf,
  Loader2,
  Mountain,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getActivityBySlug } from '@/features/activities/services/activity.service';
import type { ActivityDetail } from '@/features/activities/types/activity.types';
import ScheduleSelector from '@/features/booking/components/ScheduleSelector';

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

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} jam`;
  }

  return `${hours} jam ${remainingMinutes} menit`;
}

function formatPrice(price: number) {
  return `Rp ${price.toLocaleString('id-ID')}`;
}

function getRuleIcon(ruleType: string) {
  switch (ruleType) {
    case 'SAFETY_GEAR':
      return ShieldCheck;
    case 'AGE_RESTRICTION':
      return Users;
    case 'TERMS_AND_CONDITIONS':
      return CheckCircle2;
    default:
      return CheckCircle2;
  }
}

export default function ActivityDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScheduleSelector, setShowScheduleSelector] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadActivity() {
      if (!slug) {
        setError('Aktivitas tidak ditemukan.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getActivityBySlug(slug);

        if (!mounted) return;

        if (!data) {
          setError('Aktivitas yang Anda cari tidak ditemukan.');
          setActivity(null);
          return;
        }

        setActivity(data);
      } catch (err) {
        console.error('GET ACTIVITY DETAIL ERROR:', err);

        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Gagal memuat detail aktivitas.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadActivity();

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3 text-emerald-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Memuat detail aktivitas...</span>
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <Target className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-xl font-bold">
            Aktivitas Tidak Ditemukan
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            {error || 'Aktivitas yang Anda cari tidak tersedia.'}
          </p>

          <Link
            to="/activities"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Aktivitas
          </Link>
        </div>
      </div>
    );
  }

  const Icon = getActivityIcon(activity.slug);
  const category = activity.category.name;

  const activePricing = activity.pricing.filter(
    (pricing) => pricing.is_active
  );

  const primaryPricing = activePricing[0] ?? null;

  const primaryImage =
    activity.images.find((image) => image.is_primary) ??
    [...activity.images].sort(
      (a, b) => a.display_order - b.display_order
    )[0] ??
    null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-900" />

        <div className="absolute inset-0">
          <div className="absolute right-10 top-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Link
            to="/activities"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-emerald-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Semua Aktivitas
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-center">
            {/* Image / Icon */}
            <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60">
              {primaryImage ? (
                <div className="aspect-[4/3]">
                  <img
                    src={primaryImage.image_url}
                    alt={primaryImage.caption || activity.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-emerald-950 to-slate-900">
                  <div className="rounded-3xl bg-emerald-500/10 p-8 text-emerald-400">
                    <Icon className="h-24 w-24" strokeWidth={1.3} />
                  </div>
                </div>
              )}
            </div>

            {/* Hero Content */}
            <div>
              <span
                className={cn(
                  'inline-flex rounded-full border px-3 py-1 text-xs font-medium',
                  categoryColors[category] ||
                    'border-slate-700 bg-slate-800 text-slate-400'
                )}
              >
                {category}
              </span>

              <h1 className="mt-5 text-4xl font-bold sm:text-5xl">
                <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-sky-400 bg-clip-text text-transparent">
                  {activity.name}
                </span>
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-slate-400">
                {activity.description}
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <Clock className="h-5 w-5 text-emerald-400" />

                  <p className="mt-2 text-xs text-slate-500">
                    Durasi
                  </p>

                  <p className="mt-1 font-semibold text-white">
                    {formatDuration(activity.duration_minutes)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <Users className="h-5 w-5 text-emerald-400" />

                  <p className="mt-2 text-xs text-slate-500">
                    Kapasitas
                  </p>

                  <p className="mt-1 font-semibold text-white">
                    {activity.min_participants} -{' '}
                    {activity.max_participants} orang
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
            {/* Left */}
            <div className="space-y-10">
              {/* Pricing */}
              <div>
                <h2 className="text-2xl font-bold">
                  Pilihan Harga
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Pilih paket harga yang tersedia untuk aktivitas ini.
                </p>

                <div className="mt-5 space-y-4">
                  {activePricing.length > 0 ? (
                    activePricing.map((pricing) => (
                      <div
                        key={pricing.id}
                        className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 transition-colors hover:border-emerald-500/30"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-white">
                              {pricing.pricing_name}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              {pricing.pricing_type === 'PER_PERSON'
                                ? 'Harga per orang'
                                : pricing.pricing_type === 'PER_UNIT'
                                  ? 'Harga per unit'
                                  : 'Harga per grup'}
                            </p>
                          </div>

                          <p className="text-xl font-bold text-emerald-400">
                            {formatPrice(Number(pricing.price))}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-500">
                      Harga belum tersedia.
                    </div>
                  )}
                </div>
              </div>

              {/* Rules */}
              {activity.rules.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold">
                    Informasi & Ketentuan
                  </h2>

                  <div className="mt-5 space-y-3">
                    {activity.rules.map((rule) => {
                      const RuleIcon = getRuleIcon(rule.rule_type);

                      return (
                        <div
                          key={rule.id}
                          className="flex gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4"
                        >
                          <div className="shrink-0 rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                            <RuleIcon className="h-5 w-5" />
                          </div>

                          <div>
                            <p className="text-sm leading-relaxed text-slate-300">
                              {rule.rule_description}
                            </p>

                            {rule.min_age !== null && (
                              <p className="mt-1 text-xs text-slate-500">
                                Usia minimum: {rule.min_age} tahun
                              </p>
                            )}

                            {rule.max_age !== null && (
                              <p className="text-xs text-slate-500">
                                Usia maksimum: {rule.max_age} tahun
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Gallery */}
              {activity.images.length > 1 && (
                <div>
                  <h2 className="text-2xl font-bold">
                    Galeri
                  </h2>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {activity.images
                      .filter((image) => image.id !== primaryImage?.id)
                      .sort(
                        (a, b) =>
                          a.display_order - b.display_order
                      )
                      .map((image) => (
                        <div
                          key={image.id}
                          className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
                        >
                          <img
                            src={image.image_url}
                            alt={image.caption || activity.name}
                            className="aspect-video w-full object-cover transition-transform duration-500 hover:scale-105"
                          />

                          {image.caption && (
                            <p className="p-3 text-xs text-slate-500">
                              {image.caption}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Booking Card */}
            <aside>
              <div className="sticky top-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-sm">
                <p className="text-sm text-slate-500">
                  Mulai dari
                </p>

                {primaryPricing ? (
                  <>
                    <p className="mt-1 text-3xl font-bold text-emerald-400">
                      {formatPrice(Number(primaryPricing.price))}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {primaryPricing.pricing_type === 'PER_PERSON'
                        ? 'per orang'
                        : primaryPricing.pricing_type === 'PER_UNIT'
                          ? 'per unit'
                          : 'per grup'}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-xl font-semibold text-slate-400">
                    Harga belum tersedia
                  </p>
                )}

                <div className="my-6 border-t border-slate-800" />

                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">
                      Durasi
                    </span>

                    <span className="font-medium text-white">
                      {formatDuration(activity.duration_minutes)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">
                      Minimum
                    </span>

                    <span className="font-medium text-white">
                      {activity.min_participants} orang
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">
                      Maksimum
                    </span>

                    <span className="font-medium text-white">
                      {activity.max_participants} orang
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">
                      Jadwal
                    </span>

                    <span
                      className={cn(
                        'font-medium',
                        activity.requires_timeslot
                          ? 'text-emerald-400'
                          : 'text-slate-300'
                      )}
                    >
                      {activity.requires_timeslot
                        ? 'Pilih sesi'
                        : 'Fleksibel'}
                    </span>
                  </div>
                </div>

                <button
                    type="button"
                    onClick={() => setShowScheduleSelector(true)}
                    className={cn(
                        'mt-7 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3',
                        'bg-emerald-500 font-semibold text-slate-950',
                        'transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20',
                    )}
                >
                    Pesan Sekarang
                    <ArrowRight className="h-4 w-4" />
                </button>

                <p className="mt-4 text-center text-xs leading-relaxed text-slate-600">
                  Pemesanan dan pemilihan jadwal akan terhubung dengan
                  sistem booking pada tahap berikutnya.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
      {showScheduleSelector && (
      <section className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">

          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-emerald-400">
                Booking Aktivitas
              </p>

              <h2 className="mt-2 text-3xl font-bold text-white">
                Pilih Jadwal
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Pilih tanggal, sesi, dan jumlah peserta untuk melanjutkan.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowScheduleSelector(false)}
              className="rounded-lg border border-slate-800 px-4 py-2 text-sm text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
            >
              Tutup
            </button>
          </div>

          <ScheduleSelector
            activityId={activity.id}
            requiresTimeslot={activity.requires_timeslot}
            minParticipants={activity.min_participants}
            maxParticipants={activity.max_participants}
            onContinue={({
              scheduleId,
              scheduleDate,
              startTime,
              endTime,
              quantity,
            }) => {
              const activePricing = [...activity.pricing]
                .filter((pricing) => pricing.is_active)
                .sort((a, b) => a.price - b.price)[0];

              if (!activePricing) {
                console.error('ACTIVE PRICING NOT FOUND');
                return;
              }

              navigate('/booking/checkout', {
                state: {
                  activityId: activity.id,
                  activityName: activity.name,
                  activitySlug: activity.slug,
                  scheduleId,
                  scheduleDate,
                  startTime,
                  endTime,
                  quantity,
                  unitPrice: Number(activePricing.price),
                  pricingName: activePricing.pricing_name,
                },
              });
            }}
          />

        </div>
      </section>
    )}
    </div>
  );
}