export type ScheduleStatus = 'OPEN' | 'CLOSED' | 'FULL';

export interface ActivitySchedule {
  id: string;
  activity_id: string;
  schedule_date: string;
  start_time: string | null;
  end_time: string | null;
  total_capacity: number;
  booked_capacity: number;
  status: ScheduleStatus;
  created_at: string;
  updated_at: string;
}

export interface ActivityScheduleWithAvailability
  extends ActivitySchedule {
  remaining_capacity: number;
}