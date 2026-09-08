import { supabase } from '@/lib/supabase';
import type {
  ActivitySchedule,
  ActivityScheduleWithAvailability,
} from '../types/schedule.types';

export async function getUpcomingSchedules(
  activityId: string,
): Promise<ActivityScheduleWithAvailability[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('activity_schedules')
    .select(`
      id,
      activity_id,
      schedule_date,
      start_time,
      end_time,
      total_capacity,
      booked_capacity,
      status,
      created_at,
      updated_at
    `)
    .eq('activity_id', activityId)
    .gte('schedule_date', today)
    .in('status', ['OPEN', 'FULL'])
    .order('schedule_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('GET UPCOMING SCHEDULES ERROR:', error);
    throw error;
  }

  return (data ?? []).map((schedule) => ({
    ...(schedule as ActivitySchedule),
    remaining_capacity:
      schedule.total_capacity - schedule.booked_capacity,
  }));
}

export async function getScheduleById(
  scheduleId: string,
): Promise<ActivityScheduleWithAvailability | null> {
  const { data, error } = await supabase
    .from('activity_schedules')
    .select(`
      id,
      activity_id,
      schedule_date,
      start_time,
      end_time,
      total_capacity,
      booked_capacity,
      status,
      created_at,
      updated_at
    `)
    .eq('id', scheduleId)
    .maybeSingle();

  if (error) {
    console.error('GET SCHEDULE BY ID ERROR:', error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    ...(data as ActivitySchedule),
    remaining_capacity:
      data.total_capacity - data.booked_capacity,
  };
}