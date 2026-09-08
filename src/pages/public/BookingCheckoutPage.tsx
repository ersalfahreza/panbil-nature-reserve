import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Tag,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  createBooking,
} from '@/features/booking/services/booking.service';

interface CheckoutState {
  activityId: string;
  activityName: string;
  activitySlug: string;
  scheduleId: string;
  scheduleDate: string;
  startTime: string | null;
  endTime: string | null;
  quantity: number;
  unitPrice: number;
  pricingName: string;
}

interface ParticipantForm {
  full_name: string;
  age: string;
  identity_number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

function createParticipant(): ParticipantForm {
  return {
    full_name: '',
    age: '',
    identity_number: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function formatTime(value: string | null): string {
  if (!value) return 'Fleksibel';

  return value.slice(0, 5);
}

export default function BookingCheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as CheckoutState | null;

  const [participants, setParticipants] = useState<ParticipantForm[]>(() =>
    Array.from(
      { length: state?.quantity ?? 0 },
      createParticipant,
    ),
  );

  const [promoCode, setPromoCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const grossTotal = useMemo(() => {
    if (!state) return 0;
    return state.quantity * state.unitPrice;
  }, [state]);

  if (!state) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-20 text-white">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-2xl font-bold">
            Data booking tidak ditemukan
          </h1>

          <p className="mt-3 text-slate-400">
            Silakan kembali ke halaman aktivitas dan pilih jadwal kembali.
          </p>

          <button
            type="button"
            onClick={() => navigate('/activities')}
            className="mt-8 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Kembali ke Aktivitas
          </button>
        </div>
      </main>
    );
  }

  function updateParticipant(
    index: number,
    field: keyof ParticipantForm,
    value: string,
  ) {
    setParticipants((current) =>
      current.map((participant, participantIndex) =>
        participantIndex === index
          ? {
              ...participant,
              [field]: value,
            }
          : participant,
      ),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!state) {
        setErrorMessage(
            'Data booking tidak ditemukan. Silakan pilih jadwal kembali.'
        );
        return;
    }

    const hasEmptyName = participants.some(
      (participant) => !participant.full_name.trim(),
    );

    if (hasEmptyName) {
      setErrorMessage('Nama lengkap semua peserta wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createBooking({
        booking_number: '',
        promo_code: promoCode.trim() || null,
        items: [
          {
            activity_id: state.activityId,
            schedule_id: state.scheduleId,
            quantity: state.quantity,
            unit_price: state.unitPrice,
            participants: participants.map((participant) => ({
              full_name: participant.full_name.trim(),
              age: participant.age
                ? Number(participant.age)
                : null,
              identity_number:
                participant.identity_number.trim() || null,
              emergency_contact_name:
                participant.emergency_contact_name.trim() || null,
              emergency_contact_phone:
                participant.emergency_contact_phone.trim() || null,
            })),
          },
        ],
      });

      navigate(`/booking/success/${result.booking_id}`, {
        state: result,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Booking gagal dibuat. Silakan coba lagi.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>

        <div className="mb-10">
          <p className="text-sm font-medium text-emerald-400">
            Booking Aktivitas
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Checkout
          </h1>

          <p className="mt-3 text-slate-400">
            Lengkapi data peserta sebelum mengonfirmasi booking.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-8 lg:grid-cols-[1fr_380px]"
        >
          <div className="space-y-6">
            {/* Activity summary */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-lg font-semibold">
                Detail Aktivitas
              </h2>

              <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-5">
                <h3 className="text-xl font-bold">
                  {state.activityName}
                </h3>

                <div className="mt-4 grid gap-3 text-sm text-slate-400 sm:grid-cols-2">
                  <div>
                    <span className="block text-xs text-slate-500">
                      Tanggal
                    </span>
                    <span className="mt-1 block text-white">
                      {formatDate(state.scheduleDate)}
                    </span>
                  </div>

                  <div>
                    <span className="block text-xs text-slate-500">
                      Sesi
                    </span>
                    <span className="mt-1 block text-white">
                      {formatTime(state.startTime)}
                      {state.endTime
                        ? ` - ${formatTime(state.endTime)}`
                        : ''}
                    </span>
                  </div>

                  <div>
                    <span className="block text-xs text-slate-500">
                      Jumlah Peserta
                    </span>
                    <span className="mt-1 block text-white">
                      {state.quantity} orang
                    </span>
                  </div>

                  <div>
                    <span className="block text-xs text-slate-500">
                      Harga
                    </span>
                    <span className="mt-1 block text-white">
                      {formatCurrency(state.unitPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Participants */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                  <User className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Data Peserta
                  </h2>

                  <p className="text-sm text-slate-500">
                    Isi data untuk {state.quantity} peserta.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                {participants.map((participant, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-5"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <h3 className="font-semibold">
                        Peserta {index + 1}
                      </h3>

                      <span className="text-xs text-slate-500">
                        Data wajib
                      </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="sm:col-span-2">
                        <span className="mb-2 block text-sm text-slate-300">
                          Nama Lengkap *
                        </span>

                        <input
                          type="text"
                          value={participant.full_name}
                          onChange={(event) =>
                            updateParticipant(
                              index,
                              'full_name',
                              event.target.value,
                            )
                          }
                          placeholder="Nama lengkap peserta"
                          required
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition-colors placeholder:text-slate-600 focus:border-emerald-500"
                        />
                      </label>

                      <label>
                        <span className="mb-2 block text-sm text-slate-300">
                          Usia
                        </span>

                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={participant.age}
                          onChange={(event) =>
                            updateParticipant(
                              index,
                              'age',
                              event.target.value,
                            )
                          }
                          placeholder="Contoh: 25"
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition-colors placeholder:text-slate-600 focus:border-emerald-500"
                        />
                      </label>

                      <label>
                        <span className="mb-2 block text-sm text-slate-300">
                          Nomor Identitas
                        </span>

                        <input
                          type="text"
                          value={participant.identity_number}
                          onChange={(event) =>
                            updateParticipant(
                              index,
                              'identity_number',
                              event.target.value,
                            )
                          }
                          placeholder="Opsional"
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition-colors placeholder:text-slate-600 focus:border-emerald-500"
                        />
                      </label>

                      <label>
                        <span className="mb-2 block text-sm text-slate-300">
                          Kontak Darurat
                        </span>

                        <input
                          type="text"
                          value={participant.emergency_contact_name}
                          onChange={(event) =>
                            updateParticipant(
                              index,
                              'emergency_contact_name',
                              event.target.value,
                            )
                          }
                          placeholder="Nama kontak darurat"
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition-colors placeholder:text-slate-600 focus:border-emerald-500"
                        />
                      </label>

                      <label>
                        <span className="mb-2 block text-sm text-slate-300">
                          Telepon Darurat
                        </span>

                        <input
                          type="tel"
                          value={participant.emergency_contact_phone}
                          onChange={(event) =>
                            updateParticipant(
                              index,
                              'emergency_contact_phone',
                              event.target.value,
                            )
                          }
                          placeholder="Nomor telepon"
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition-colors placeholder:text-slate-600 focus:border-emerald-500"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Promo */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                  <Tag className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Kode Promo
                  </h2>

                  <p className="text-sm text-slate-500">
                    Masukkan kode promo jika Anda memilikinya.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(event) =>
                    setPromoCode(event.target.value.toUpperCase())
                  }
                  placeholder="Contoh: PANBIL10"
                  className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white uppercase outline-none placeholder:text-slate-600 focus:border-emerald-500"
                />
              </div>
            </section>
          </div>

          {/* Order summary */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-lg font-semibold">
                Ringkasan Booking
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-400">
                    {state.activityName}
                  </span>

                  <span className="text-white">
                    {formatCurrency(grossTotal)}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-400">
                    {state.quantity} × {formatCurrency(state.unitPrice)}
                  </span>
                </div>

                <div className="border-t border-slate-800 pt-4">
                  <div className="flex justify-between gap-4">
                    <span className="font-medium text-slate-300">
                      Total
                    </span>

                    <span className="text-xl font-bold text-emerald-400">
                      {formatCurrency(grossTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />

                <p className="text-xs leading-5 text-slate-400">
                  Setelah dikonfirmasi, booking akan ditahan selama
                  <span className="font-semibold text-amber-300">
                    {' '}15 menit
                  </span>
                  {' '}untuk menyelesaikan pembayaran.
                </p>
              </div>

              {errorMessage && (
                <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5',
                  'bg-emerald-500 font-semibold text-slate-950',
                  'transition-all hover:bg-emerald-400',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses Booking...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Konfirmasi Booking
                  </>
                )}
              </button>
            </section>
          </aside>
        </form>
      </div>
    </main>
  );
}