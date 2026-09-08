import { Link } from 'react-router-dom';
import {
  Trees,
  Ticket,
  CalendarCheck,
  Sparkles,
  GraduationCap,
  Leaf,
  Mountain,
  Target,
  Car,
  ArrowRight,
  Shield,
  Clock,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Sparkles,
    title: '5 Aktivitas Premium',
    description: 'Nikmati beragam aktivitas ekowisata yang dirancang untuk semua kalangan.',
  },
  {
    icon: CalendarCheck,
    title: 'Reservasi Online',
    description: 'Pesan tiket dengan mudah kapan saja dan di mana saja secara online.',
  },
  {
    icon: Ticket,
    title: 'E-Ticket Instan',
    description: 'Dapatkan e-ticket langsung setelah pembayaran dikonfirmasi.',
  },
];

const activities = [
  {
    icon: GraduationCap,
    name: 'Edu Park',
    slug: 'edu-park',
    description: 'Wisata edukasi interaktif tentang flora dan fauna tropis Batam.',
    price: 75000,
  },
  {
    icon: Leaf,
    name: 'Eco Park',
    slug: 'eco-park',
    description: 'Jelajahi taman ekologi dengan keanekaragaman hayati yang memukau.',
    price: 85000,
  },
  {
    icon: Mountain,
    name: 'Hiking Trail',
    slug: 'hiking-trail',
    description: 'Trekking menyusuri jalur hutan tropis dengan pemandangan menakjubkan.',
    price: 100000,
  },
  {
    icon: Target,
    name: 'Paintball',
    slug: 'paintball',
    description: 'Adu strategi dan ketangkasan dalam arena paintball profesional.',
    price: 150000,
  },
  {
    icon: Car,
    name: 'ATV Adventure',
    slug: 'atv-adventure',
    description: 'Pacu adrenalin dengan ATV melintasi medan off-road yang menantang.',
    price: 200000,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-900" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-emerald-600/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8 lg:py-44">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
              <Trees className="h-4 w-4" />
              <span>Ekowisata Premium di Batam</span>
            </div>

            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-sky-400 bg-clip-text text-transparent">
                Panbil Nature Reserve
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl">
              Premium Ecotourism Destination di Batam — Rasakan keindahan alam tropis
              dengan aktivitas ekowisata yang tak terlupakan.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/activities"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-8 py-4 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:brightness-110"
              >
                Jelajahi Aktivitas
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-8 py-4 font-semibold text-white backdrop-blur-sm transition-all hover:border-emerald-500/50 hover:bg-slate-800"
              >
                Pesan Sekarang
              </Link>
            </div>

            <div className="mx-auto mt-16 flex max-w-lg flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                <span>Aman & Terpercaya</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-500" />
                <span>Buka Setiap Hari</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                <span>Rating 4.8/5</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative border-t border-slate-800/50 bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
                Kenapa Memilih Kami?
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              Kami menyediakan pengalaman ekowisata terbaik dengan layanan premium dan kemudahan akses.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={cn(
                  'group rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm',
                  'transition-all duration-300 hover:border-emerald-500/30 hover:bg-slate-800/50 hover:shadow-lg hover:shadow-emerald-500/5'
                )}
              >
                <div className="mb-4 inline-flex rounded-xl bg-emerald-500/10 p-3 text-emerald-400 transition-colors group-hover:bg-emerald-500/20">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Activities Preview Section */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-950 to-slate-950" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              <span className="bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">
                Aktivitas Unggulan
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              Temukan petualangan seru dan pengalaman tak terlupakan di Panbil Nature Reserve.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((activity) => (
              <Link
                key={activity.slug}
                to={`/activities/${activity.slug}`}
                className={cn(
                  'group rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm',
                  'transition-all duration-300 hover:border-emerald-500/30 hover:bg-slate-800/60 hover:shadow-xl hover:shadow-emerald-500/5',
                  'hover:-translate-y-1'
                )}
              >
                <div className="mb-4 inline-flex rounded-xl bg-emerald-500/10 p-3 text-emerald-400 transition-colors group-hover:bg-emerald-500/20">
                  <activity.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  {activity.name}
                </h3>
                <p className="mt-2 text-sm text-slate-400 line-clamp-2">{activity.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500">Mulai dari</span>
                    <p className="text-lg font-bold text-emerald-400">
                      Rp {activity.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-emerald-400 opacity-0 transition-opacity group-hover:opacity-100">
                    <span>Detail</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/activities"
              className="group inline-flex items-center gap-2 text-emerald-400 transition-colors hover:text-emerald-300"
            >
              <span className="font-semibold">Lihat Semua Aktivitas</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden border-t border-slate-800/50">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/50 via-slate-950 to-emerald-950/50" />
        <div className="absolute inset-0">
          <div className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
            <span className="bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
              Siap Untuk Petualangan?
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            Daftar sekarang dan nikmati kemudahan reservasi online untuk semua aktivitas ekowisata
            premium di Panbil Nature Reserve.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-8 py-4 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:brightness-110"
            >
              Daftar Sekarang
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-8 py-4 font-semibold text-white backdrop-blur-sm transition-all hover:border-emerald-500/50 hover:bg-slate-800"
            >
              Sudah Punya Akun? Masuk
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
