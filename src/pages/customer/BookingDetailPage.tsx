import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  Users,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { getBookingDetail } from '@/features/booking/services/booking.service';
import type {
  BookingDetail,
  BookingStatus,
} from '@/features/booking/types/booking.types';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null): string {
  if (!value) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatTime(value: string | null): string {
  if (!value) return '';

  return value.slice(0, 5);
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

export default function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBooking() {
      if (!bookingId) {
        setError('ID booking tidak ditemukan.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getBookingDetail(bookingId);

        if (!cancelled) {
          setBooking(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Gagal mengambil detail booking.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadBooking();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Memuat detail reservasi...
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate('/dashboard/bookings')}
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Reservasi Saya
        </button>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <h1 className="text-xl font-semibold text-white">
            Booking tidak ditemukan
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            {error ?? 'Data booking tidak tersedia.'}
          </p>

          <Link
            to="/dashboard/bookings"
            className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Kembali ke Reservasi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/bookings')}
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Reservasi Saya
        </button>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">
              Detail Reservasi
            </p>

            <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">
              {booking.booking_number}
            </h1>
          </div>

          <span
            className={`inline-flex w-fit items-center rounded-full border px-4 py-2 text-sm font-semibold ${getStatusClass(
              booking.status,
            )}`}
          >
            {getStatusLabel(booking.status)}
          </span>
        </div>
      </div>

      {/* Pending payment */}
      {booking.status === 'PENDING' && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />

            <div className="flex-1">
              <p className="font-semibold text-amber-300">
                Menunggu pembayaran
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Selesaikan pembayaran sebelum batas waktu berikut:
              </p>

              <p className="mt-2 text-sm font-semibold text-white">
                {formatDateTime(booking.expires_at)}
              </p>
            </div>

            <button
              type="button"
              disabled
              className="hidden rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white opacity-60 sm:block"
            >
              Bayar Sekarang
            </button>
          </div>
        </div>
      )}

      {/* Booking information */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-6">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-emerald-400" />

              <h2 className="font-semibold text-white">
                Aktivitas yang Dipesan
              </h2>
            </div>

            <div className="mt-6 space-y-5">
              {booking.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {item.activity_name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {item.quantity}{' '}
                        {item.quantity === 1
                          ? 'peserta/unit'
                          : 'peserta/unit'}
                      </p>
                    </div>

                    <p className="text-lg font-bold text-white">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-slate-800 pt-5 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <CalendarDays className="mt-0.5 h-4 w-4 text-slate-500" />

                      <div>
                        <p className="text-xs text-slate-500">
                          Tanggal
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-200">
                          {formatDate(item.schedule_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-4 w-4 text-slate-500" />

                      <div>
                        <p className="text-xs text-slate-500">
                          Waktu
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-200">
                          {item.start_time
                            ? `${formatTime(item.start_time)}${
                                item.end_time
                                  ? ` - ${formatTime(item.end_time)}`
                                  : ''
                              }`
                            : 'Waktu fleksibel'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Participants */}
                  {item.participants.length > 0 && (
                    <div className="mt-5 border-t border-slate-800 pt-5">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-500" />

                        <h4 className="text-sm font-semibold text-slate-300">
                          Peserta
                        </h4>
                      </div>

                      <div className="mt-3 space-y-2">
                        {item.participants.map(
                          (participant, index) => (
                            <div
                              key={participant.id}
                              className="rounded-lg bg-slate-900 px-4 py-3"
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="text-sm font-medium text-white">
                                    {index + 1}.{' '}
                                    {participant.full_name}
                                  </p>

                                  {participant.age !== null && (
                                    <p className="mt-1 text-xs text-slate-500">
                                      Usia {participant.age} tahun
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Created information */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-6">
            <h2 className="font-semibold text-white">
              Informasi Reservasi
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">
                  Dibuat pada
                </p>

                <p className="mt-1 text-sm text-slate-200">
                  {formatDateTime(booking.created_at)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Terakhir diperbarui
                </p>

                <p className="mt-1 text-sm text-slate-200">
                  {formatDateTime(booking.updated_at)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Payment summary */}
        <aside className="lg:col-span-1">
          <div className="sticky top-6 rounded-2xl border border-slate-800/60 bg-slate-900/50 p-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-400" />

              <h2 className="font-semibold text-white">
                Ringkasan Pembayaran
              </h2>
            </div>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  Total
                </span>

                <span className="font-medium text-white">
                  {formatCurrency(booking.total_amount)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  Diskon
                </span>

                <span className="font-medium text-emerald-400">
                  - {formatCurrency(booking.discount_amount)}
                </span>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <div className="flex justify-between gap-4">
                  <span className="font-semibold text-slate-300">
                    Yang harus dibayar
                  </span>

                  <span className="text-xl font-bold text-white">
                    {formatCurrency(booking.final_amount)}
                  </span>
                </div>
              </div>
            </div>

            {booking.status === 'PAID' && (
              <div className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-300">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                Pembayaran telah diterima.
              </div>
            )}

            {booking.status === 'PENDING' && (
              <button
                type="button"
                disabled
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white opacity-60"
              >
                <CreditCard className="h-4 w-4" />
                Bayar Sekarang
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}