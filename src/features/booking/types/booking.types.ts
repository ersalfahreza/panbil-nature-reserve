export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PAID'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'COMPLETED';

export interface BookingParticipantInput {
  full_name: string;
  age?: number | null;
  identity_number?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
}

export interface CreateBookingItemInput {
  activity_id: string;
  schedule_id: string;
  quantity: number;
  unit_price: number;
  participants?: BookingParticipantInput[];
}

export interface CreateBookingInput {
  booking_number: string;
  items: CreateBookingItemInput[];
  promo_code?: string | null;
}

export interface CreateBookingResponse {
  status: 'SUCCESS';
  booking_id: string;
  booking_number: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  expires_at: string;
}

export interface Booking {
  id: string;
  booking_number: string;
  customer_id: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  status: BookingStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface BookingItem {
  id: string;
  booking_id: string;
  activity_id: string;
  schedule_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount_amount: number;
  created_at: string;
}

export interface BookingParticipant {
  id: string;
  booking_item_id: string;
  full_name: string;
  age: number | null;
  identity_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: string;
}

export interface BookingListItem extends Booking {
  item_count: number;
}

export interface BookingDetailItem extends BookingItem {
  activity_name: string;
  activity_slug: string;
  schedule_date: string | null;
  start_time: string | null;
  end_time: string | null;
  participants: BookingParticipant[];
}

export interface BookingDetail extends Booking {
  items: BookingDetailItem[];
}