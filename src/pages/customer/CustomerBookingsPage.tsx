import { useEffect, useState } from 'react';
import {
  CalendarDays,
  ChevronRight,
  Clock,
  Loader2,
  Receipt,
  Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';
import { getMyBookings } from '@/features/booking/services/booking.service';
import type {
  BookingListItem,
  BookingStatus,
} from '@/features/booking/types/booking.types';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

function getStatusLabel(status: BookingStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Menunggu Pembayaran';

    case 'CONFIRMED':
      return 'Dikonfirmasi';

    case 'PAID':
      return 'Sudah Dibayar';

    case 'CANCELLED':
      return 'Dibatalkan';

    case 'EXPIRED':
      return 'Kedaluwarsa';

    case 'COMPLETED':
      return 'Selesai';

    default:
      return status;
  }
}

function getStatusClass(status: BookingStatus): string {
  switch (status) {
    case 'PENDING':
      return 'border-amber-500/20 bg-amber-500/10 text-amber-300';

    case 'CONFIRMED':
    case 'PAID':
    case 'COMPLETED':
      return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';

    case 'CANCELLED':
    case 'EXPIRED':
      return 'border-red-500/20 bg-red-500/10 text-red-300';

    default:
      return 'border-slate-700 bg-slate-800 text-slate-300';
  }
}

function BookingCard({
  booking,
}: {
  booking: BookingListItem;
}) {
  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-5 transition-colors hover:border-slate-700 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-400" />

            <span className="text-sm font-semibold tracking-wide text-white">
              {booking.booking_number}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
            <CalendarDays className="h-4 w-4" />

            <span>
              Dibuat {formatDate(booking.created_at)}
            </span>
          </div>
        </div>

        <span
          className={cn(
            'inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-semibold',
            getStatusClass(booking.status),
          )}
        >
          {getStatusLabel(booking.status)}
        </span>
      </div>

      <div className="mt-5 grid gap-4 border-t border-slate-800 pt-5 sm:grid-cols-3">
        <div>
          <p className="text-xs text-slate-500">
            Jumlah Aktivitas
          </p>

          <p className="mt-1 font-semibold text-white">
            {booking.item_count}{' '}
            {booking.item_count === 1
              ? 'aktivitas'
              : 'aktivitas'}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">
            Total
          </p>

          <p className="mt-1 font-semibold text-white">
            {formatCurrency(booking.final_amount)}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">
            Batas Pembayaran
          </p>

          <div className="mt-1 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-slate-500" />

            <p className="font-semibold text-white">
              {booking.status === 'PENDING'
                ? formatDate(booking.expires_at)
                : '-'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end border-t border-slate-800 pt-5">
        <Link
          to={`/dashboard/bookings/${booking.id}`}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
        >
          Lihat Detail
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBookings() {
      try {
        setLoading(true);
        setError(null);

        const data = await getMyBookings();

        if (!cancelled) {
          setBookings(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Gagal mengambil reservasi.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadBookings();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl">
          Reservasi Saya
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Lihat dan kelola seluruh reservasi yang pernah Anda buat.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-800/60 bg-slate-900/50">
          <div className="flex items-center gap-3 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Memuat reservasi...
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <h2 className="text-lg font-semibold text-white">
            Gagal memuat reservasi
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && bookings.length === 0 && (
        <div
          className={cn(
            'rounded-2xl border border-slate-800/50 bg-slate-900/50 backdrop-blur',
            'flex flex-col items-center justify-center px-6 py-20 text-center',
          )}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <Search className="h-8 w-8 text-emerald-400" />
          </div>

          <h2 className="mt-5 text-lg font-semibold text-white">
            Belum ada reservasi
          </h2>

          <p className="mt-2 max-w-sm text-sm text-slate-400">
            Anda belum memiliki reservasi. Jelajahi aktivitas
            yang tersedia dan buat reservasi pertama Anda!
          </p>

          <Link
            to="/activities"
            className={cn(
              'mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium',
              'bg-emerald-600 text-white transition-colors hover:bg-emerald-500',
            )}
          >
            <Search className="h-4 w-4" />
            Jelajahi Aktivitas
          </Link>
        </div>
      )}

      {/* Booking list */}
      {!loading && !error && bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
            />
          ))}
        </div>
      )}
    </div>
  );
}