import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUpcomingSchedules } from '@/features/schedules/services/schedule.service';
import type { ActivityScheduleWithAvailability } from '@/features/schedules/types/schedule.types';

interface ScheduleSelectorProps {
  activityId: string;
  requiresTimeslot: boolean;
  minParticipants: number;
  maxParticipants: number;
  onContinue: (selection: {
  scheduleId: string;
  scheduleDate: string;
  startTime: string | null;
  endTime: string | null;
  quantity: number;
  }) => void;
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${dateString}T00:00:00`));
}

function formatFullDate(dateString: string) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${dateString}T00:00:00`));
}

function formatTime(time: string | null) {
  if (!time) return null;

  return time.slice(0, 5);
}

export default function ScheduleSelector({
  activityId,
  requiresTimeslot,
  minParticipants,
  maxParticipants,
  onContinue,
}: ScheduleSelectorProps) {
  const [schedules, setSchedules] = useState<
    ActivityScheduleWithAvailability[]
  >([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null,
  );
  const [quantity, setQuantity] = useState(minParticipants);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSchedules() {
      try {
        setLoading(true);
        setError(null);

        const data = await getUpcomingSchedules(activityId);

        if (!mounted) return;

        setSchedules(data);

        if (data.length > 0) {
          const firstDate = data[0].schedule_date;
          setSelectedDate(firstDate);

          if (requiresTimeslot) {
            const firstAvailable = data.find(
              (schedule) =>
                schedule.schedule_date === firstDate &&
                schedule.remaining_capacity >= minParticipants &&
                schedule.status === 'OPEN',
            );

            setSelectedScheduleId(firstAvailable?.id ?? null);
          } else {
            const firstAvailable = data.find(
              (schedule) =>
                schedule.schedule_date === firstDate &&
                schedule.remaining_capacity >= minParticipants &&
                schedule.status === 'OPEN',
            );

            setSelectedScheduleId(firstAvailable?.id ?? null);
          }
        }
      } catch (err) {
        console.error('LOAD SCHEDULE SELECTOR ERROR:', err);

        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Gagal memuat jadwal aktivitas.',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSchedules();

    return () => {
      mounted = false;
    };
  }, [activityId, minParticipants, requiresTimeslot]);

  const availableDates = useMemo(() => {
    return [...new Set(schedules.map((schedule) => schedule.schedule_date))];
  }, [schedules]);

  const schedulesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];

    return schedules.filter(
      (schedule) => schedule.schedule_date === selectedDate,
    );
  }, [schedules, selectedDate]);

  const selectedSchedule = schedules.find(
    (schedule) => schedule.id === selectedScheduleId,
  );

  function handleDateChange(date: string) {
    setSelectedDate(date);
    setSelectedScheduleId(null);

    const available = schedules.find(
      (schedule) =>
        schedule.schedule_date === date &&
        schedule.status === 'OPEN' &&
        schedule.remaining_capacity >= minParticipants,
    );

    if (available) {
      setSelectedScheduleId(available.id);

      setQuantity((current) =>
        Math.min(
          Math.max(current, minParticipants),
          Math.min(maxParticipants, available.remaining_capacity),
        ),
      );
    }
  }

  function handleScheduleChange(schedule: ActivityScheduleWithAvailability) {
    if (
      schedule.status !== 'OPEN' ||
      schedule.remaining_capacity < minParticipants
    ) {
      return;
    }

    setSelectedScheduleId(schedule.id);

    setQuantity((current) =>
      Math.min(
        Math.max(current, minParticipants),
        Math.min(maxParticipants, schedule.remaining_capacity),
      ),
    );
  }

  function decreaseQuantity() {
    setQuantity((current) => Math.max(minParticipants, current - 1));
  }

  function increaseQuantity() {
    const maxAvailable = Math.min(
      maxParticipants,
      selectedSchedule?.remaining_capacity ?? maxParticipants,
    );

    setQuantity((current) => Math.min(maxAvailable, current + 1));
  }

  function handleContinue() {
    if (!selectedSchedule) {
      return;
    }

    onContinue({
      scheduleId: selectedSchedule.id,
      scheduleDate: selectedSchedule.schedule_date,
      startTime: selectedSchedule.start_time,
      endTime: selectedSchedule.end_time,
      quantity,
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/50 p-10">
        <div className="flex items-center gap-3 text-emerald-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Memuat jadwal...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <p className="text-sm font-medium text-red-400">
          Gagal memuat jadwal
        </p>

        <p className="mt-1 text-sm text-slate-500">{error}</p>
      </div>
    );
  }

  if (availableDates.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
        <CalendarDays className="mx-auto h-8 w-8 text-slate-600" />

        <h3 className="mt-4 font-semibold text-white">
          Jadwal Belum Tersedia
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          Belum ada jadwal aktivitas yang tersedia untuk dipesan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-emerald-400" />

          <h3 className="text-xl font-bold text-white">
            Pilih Tanggal
          </h3>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {availableDates.map((date) => {
            const isSelected = selectedDate === date;

            return (
              <button
                key={date}
                type="button"
                onClick={() => handleDateChange(date)}
                className={cn(
                  'rounded-xl border p-3 text-left transition-all',
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700',
                )}
              >
                <p
                  className={cn(
                    'text-xs',
                    isSelected
                      ? 'text-emerald-400'
                      : 'text-slate-500',
                  )}
                >
                  {formatDate(date)}
                </p>

                <p
                  className={cn(
                    'mt-1 text-sm font-semibold',
                    isSelected ? 'text-white' : 'text-slate-300',
                  )}
                >
                  {new Date(`${date}T00:00:00`).getDate()}
                </p>
              </button>
            );
          })}
        </div>

        {selectedDate && (
          <p className="mt-3 text-sm text-slate-500">
            {formatFullDate(selectedDate)}
          </p>
        )}
      </div>

      {requiresTimeslot && (
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-400" />

            <h3 className="text-xl font-bold text-white">
              Pilih Sesi
            </h3>
          </div>

          <div className="mt-4 space-y-3">
            {schedulesForSelectedDate.map((schedule) => {
              const disabled =
                schedule.status !== 'OPEN' ||
                schedule.remaining_capacity < minParticipants;

              const isSelected = selectedScheduleId === schedule.id;

              return (
                <button
                  key={schedule.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleScheduleChange(schedule)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all',
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700',
                    disabled &&
                      'cursor-not-allowed opacity-40 hover:border-slate-800',
                  )}
                >
                  <div>
                    <p className="font-semibold text-white">
                      {formatTime(schedule.start_time)} -{' '}
                      {formatTime(schedule.end_time)}
                    </p>

                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <Users className="h-3.5 w-3.5" />

                      <span>
                        {schedule.remaining_capacity} slot tersisa
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="text-xs font-semibold text-emerald-400">
                      Dipilih
                    </span>
                  )}

                  {disabled && (
                    <span className="text-xs font-semibold text-red-400">
                      Penuh
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!requiresTimeslot && selectedSchedule && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">
                Tiket tersedia
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {selectedSchedule.remaining_capacity} slot tersisa
              </p>
            </div>

            <Users className="h-5 w-5 text-emerald-400" />
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-400" />

          <h3 className="text-xl font-bold text-white">
            Jumlah Peserta
          </h3>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div>
            <p className="font-semibold text-white">
              {quantity} orang
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Minimum {minParticipants} · Maksimum {maxParticipants}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={decreaseQuantity}
              disabled={quantity <= minParticipants}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 text-lg text-white transition-colors hover:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-30"
            >
              −
            </button>

            <span className="w-8 text-center font-semibold text-white">
              {quantity}
            </span>

            <button
              type="button"
              onClick={increaseQuantity}
              disabled={
                !selectedSchedule ||
                quantity >=
                  Math.min(
                    maxParticipants,
                    selectedSchedule.remaining_capacity,
                  )
              }
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 text-lg text-white transition-colors hover:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={!selectedScheduleId}
        onClick={handleContinue}
        className="w-full rounded-xl bg-emerald-500 px-5 py-3.5 font-semibold text-slate-950 transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Lanjutkan Booking
      </button>
    </div>
  );
}