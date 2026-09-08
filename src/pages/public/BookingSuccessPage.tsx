import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  Receipt,
} from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { getBookingDetail } from '@/features/booking/services/booking.service';
import type { BookingDetail } from '@/features/booking/types/booking.types';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatExpiry(value: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

interface BookingSuccessState {
  status: 'SUCCESS';
  booking_id: string;
  booking_number: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  expires_at: string;
}

export default function BookingSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();

  const stateBooking =
    location.state as BookingSuccessState | null;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = bookingId ?? stateBooking?.booking_id;

    if (!id) {
      return;
    }

    let cancelled = false;

    async function loadBooking(bookingIdToLoad: string) {
      try {
        setLoading(true);
        setError(null);

        const data = await getBookingDetail(bookingIdToLoad);

        if (!cancelled) {
          setBooking(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Gagal mengambil data booking.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadBooking(id);

    return () => {
      cancelled = true;
    };
  }, [bookingId, stateBooking?.booking_id]);

  /*
   * Jika halaman dibuka dari hasil createBooking lama,
   * kita masih bisa menggunakan location.state sebagai fallback.
   */
  const displayBooking = booking ?? stateBooking;

  if (loading && !displayBooking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Memuat detail booking...
        </div>
      </main>
    );
  }

  if (!displayBooking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-xl text-center">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl sm:p-10">
            <h1 className="text-2xl font-bold">
              Data booking tidak ditemukan
            </h1>

            <p className="mt-3 text-slate-400">
              Booking tidak dapat ditemukan. Silakan cek daftar
              reservasi Anda.
            </p>

            <Link
              to="/dashboard/bookings"
              className="mt-6 inline-flex rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
            >
              Lihat Reservasi Saya
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const detailBooking = booking;

  const bookingNumber =
    detailBooking?.booking_number ??
    displayBooking.booking_number;

  const totalAmount =
    detailBooking?.total_amount ??
    displayBooking.total_amount;

  const discountAmount =
    detailBooking?.discount_amount ??
    displayBooking.discount_amount;

  const finalAmount =
    detailBooking?.final_amount ??
    displayBooking.final_amount;

  const expiresAt =
    detailBooking?.expires_at ??
    displayBooking.expires_at;

  const detailId =
    detailBooking?.id ??
    bookingId ??
    stateBooking?.booking_id;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-16 text-white">
      <div className="w-full max-w-xl">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-2xl sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-9 w-9 text-emerald-400" />
          </div>

          <p className="mt-6 text-sm font-medium text-emerald-400">
            Booking Berhasil
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Booking berhasil dibuat
          </h1>

          <p className="mt-3 text-slate-400">
            Silakan selesaikan pembayaran sebelum waktu booking
            berakhir.
          </p>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Receipt className="h-4 w-4" />
              Nomor Booking
            </div>

            <p className="mt-2 text-2xl font-bold tracking-wide text-white">
              {bookingNumber}
            </p>

            <div className="mt-6 grid gap-4 text-left sm:grid-cols-2">
              <div>
                <span className="text-xs text-slate-500">
                  Total
                </span>

                <p className="mt-1 font-semibold text-white">
                  {formatCurrency(totalAmount)}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-500">
                  Diskon
                </span>

                <p className="mt-1 font-semibold text-emerald-400">
                  {formatCurrency(discountAmount)}
                </p>
              </div>

              <div className="sm:col-span-2">
                <span className="text-xs text-slate-500">
                  Yang harus dibayar
                </span>

                <p className="mt-1 text-2xl font-bold text-white">
                  {formatCurrency(finalAmount)}
                </p>
              </div>
            </div>
          </div>

          {displayBooking.status === 'PENDING' && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-left">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />

              <div>
                <p className="text-sm font-medium text-amber-300">
                  Batas pembayaran
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  {formatExpiry(expiresAt)}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-left">
              <p className="text-sm text-red-300">
                Detail booking belum dapat dimuat.
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {error}
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3">
            {detailId && (
  <Link
    to={'/dashboard/bookings/' + detailId}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
              >
                Lihat Detail Booking
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            <Link
              to="/dashboard/bookings"
              className="flex items-center justify-center rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
            >
              Lihat Semua Reservasi
            </Link>

            <Link
              to="/activities"
              className="flex items-center justify-center rounded-xl border border-slate-800 px-5 py-3 text-sm font-medium text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
            >
              Kembali ke Aktivitas
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}