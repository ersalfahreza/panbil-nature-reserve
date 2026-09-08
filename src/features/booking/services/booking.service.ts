import { supabase } from '@/lib/supabase';
import type {
  Booking,
  BookingDetail,
  BookingDetailItem,
  BookingListItem,
  BookingParticipant,
  CreateBookingInput,
  CreateBookingResponse,
} from '../types/booking.types';

function generateBookingNumber(): string {
  const now = new Date();

  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');

  const random = crypto.randomUUID().slice(0, 8).toUpperCase();

  return `PNR-${date}-${random}`;
}

export async function createBooking(
  input: CreateBookingInput,
): Promise<CreateBookingResponse> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Anda harus login untuk membuat booking.');
  }

  if (!input.items.length) {
    throw new Error('Booking harus memiliki minimal satu aktivitas.');
  }

  const bookingNumber = input.booking_number || generateBookingNumber();

  const items = input.items.map((item) => ({
    activity_id: item.activity_id,
    schedule_id: item.schedule_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    ...(item.participants?.length
      ? { participants: item.participants }
      : {}),
  }));

  const { data, error } = await supabase.rpc('fn_create_booking_atomic', {
    p_customer_id: user.id,
    p_booking_number: bookingNumber,
    p_items: items,
    p_promo_code: input.promo_code?.trim() || null,
  });

  if (error) {
    console.error('CREATE BOOKING ERROR:', error);

    throw new Error(getBookingErrorMessage(error.message));
  }

  if (!data || data.status !== 'SUCCESS') {
    throw new Error('Booking gagal dibuat. Silakan coba lagi.');
  }

  return {
    status: 'SUCCESS',
    booking_id: data.booking_id,
    booking_number: data.booking_number,
    total_amount: Number(data.total_amount),
    discount_amount: Number(data.discount_amount),
    final_amount: Number(data.final_amount),
    expires_at: data.expires_at,
  };
}

export async function getMyBookings(): Promise<BookingListItem[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Anda harus login untuk melihat reservasi.');
  }

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (customerError) {
    console.error('GET CUSTOMER ERROR:', customerError);
    throw new Error('Gagal mengambil data pelanggan.');
  }

  if (!customer) {
    throw new Error('Data pelanggan tidak ditemukan.');
  }

  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false });

  if (bookingsError) {
    console.error('GET BOOKINGS ERROR:', bookingsError);
    throw new Error('Gagal mengambil daftar reservasi.');
  }

  const bookingRows = (bookings ?? []) as Booking[];

  if (!bookingRows.length) {
    return [];
  }

  const bookingIds = bookingRows.map((booking) => booking.id);

  const { data: items, error: itemsError } = await supabase
    .from('booking_items')
    .select('booking_id')
    .in('booking_id', bookingIds);

  if (itemsError) {
    console.error('GET BOOKING ITEMS ERROR:', itemsError);
    throw new Error('Gagal mengambil detail reservasi.');
  }

  const itemCountMap = new Map<string, number>();

  for (const item of items ?? []) {
    const bookingId = item.booking_id as string;

    itemCountMap.set(
      bookingId,
      (itemCountMap.get(bookingId) ?? 0) + 1,
    );
  }

  return bookingRows.map((booking) => ({
    ...booking,
    item_count: itemCountMap.get(booking.id) ?? 0,
  }));
}

export async function getBookingDetail(
  bookingId: string,
): Promise<BookingDetail> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Anda harus login untuk melihat reservasi.');
  }

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (customerError) {
    console.error('GET CUSTOMER ERROR:', customerError);
    throw new Error('Gagal mengambil data pelanggan.');
  }

  if (!customer) {
    throw new Error('Data pelanggan tidak ditemukan.');
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .eq('customer_id', customer.id)
    .maybeSingle();

  if (bookingError) {
    console.error('GET BOOKING DETAIL ERROR:', bookingError);
    throw new Error('Gagal mengambil detail reservasi.');
  }

  if (!booking) {
    throw new Error('Reservasi tidak ditemukan.');
  }

  const { data: items, error: itemsError } = await supabase
    .from('booking_items')
    .select(`
      id,
      booking_id,
      activity_id,
      schedule_id,
      quantity,
      unit_price,
      subtotal,
      discount_amount,
      created_at
    `)
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });

  if (itemsError) {
    console.error('GET BOOKING ITEMS ERROR:', itemsError);
    throw new Error('Gagal mengambil item reservasi.');
  }

  const bookingItems = (items ?? []) as BookingDetailItem[];

  if (!bookingItems.length) {
    return {
      ...(booking as Booking),
      items: [],
    };
  }

  const activityIds = [
    ...new Set(
      bookingItems.map((item) => item.activity_id),
    ),
  ];

  const scheduleIds = [
    ...new Set(
      bookingItems
        .map((item) => item.schedule_id)
        .filter(Boolean),
    ),
  ];

  const itemIds = bookingItems.map((item) => item.id);

  const [
    { data: activities, error: activitiesError },
    { data: schedules, error: schedulesError },
    { data: participants, error: participantsError },
  ] = await Promise.all([
    supabase
      .from('activities')
      .select('id, name, slug')
      .in('id', activityIds),

    supabase
      .from('activity_schedules')
      .select(
        'id, schedule_date, start_time, end_time',
      )
      .in('id', scheduleIds),

    supabase
      .from('booking_participants')
      .select(`
        id,
        booking_item_id,
        full_name,
        age,
        identity_number,
        emergency_contact_name,
        emergency_contact_phone,
        created_at
      `)
      .in('booking_item_id', itemIds),
  ]);

  if (activitiesError) {
    console.error('GET ACTIVITIES ERROR:', activitiesError);
    throw new Error('Gagal mengambil aktivitas reservasi.');
  }

  if (schedulesError) {
    console.error('GET SCHEDULES ERROR:', schedulesError);
    throw new Error('Gagal mengambil jadwal reservasi.');
  }

  if (participantsError) {
    console.error(
      'GET PARTICIPANTS ERROR:',
      participantsError,
    );
    throw new Error('Gagal mengambil data peserta.');
  }

  const activityMap = new Map(
    (activities ?? []).map((activity) => [
      activity.id,
      activity,
    ]),
  );

  const scheduleMap = new Map(
    (schedules ?? []).map((schedule) => [
      schedule.id,
      schedule,
    ]),
  );

  const participantMap = new Map<
    string,
    BookingParticipant[]
  >();

  for (const participant of (participants ?? []) as BookingParticipant[]) {
    const existing =
      participantMap.get(participant.booking_item_id) ?? [];

    existing.push(participant);
    participantMap.set(
      participant.booking_item_id,
      existing,
    );
  }

  const detailItems: BookingDetailItem[] =
    bookingItems.map((item) => {
      const activity = activityMap.get(item.activity_id);
      const schedule = scheduleMap.get(item.schedule_id);

      return {
        ...item,
        activity_name:
          activity?.name ?? 'Aktivitas tidak ditemukan',
        activity_slug: activity?.slug ?? '',
        schedule_date:
          schedule?.schedule_date ?? null,
        start_time:
          schedule?.start_time ?? null,
        end_time:
          schedule?.end_time ?? null,
        participants:
          participantMap.get(item.id) ?? [],
      };
    });

  return {
    ...(booking as Booking),
    items: detailItems,
  };
}

function getBookingErrorMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('empty_cart')) {
    return 'Booking tidak boleh kosong.';
  }

  if (normalized.includes('schedule_not_found')) {
    return 'Jadwal yang dipilih tidak ditemukan.';
  }

  if (normalized.includes('schedule_closed')) {
    return 'Jadwal tersebut sudah tidak tersedia.';
  }

  if (normalized.includes('capacity_exceeded')) {
    return 'Jumlah peserta melebihi kapasitas yang tersedia.';
  }

  if (normalized.includes('promo_invalid')) {
    return 'Kode promo tidak valid atau sudah tidak berlaku.';
  }

  if (normalized.includes('promo_min_purchase')) {
    return 'Minimum pembelian untuk kode promo belum terpenuhi.';
  }

  if (normalized.includes('promo_not_eligible')) {
    return 'Kode promo tidak berlaku untuk aktivitas yang dipilih.';
  }

  if (normalized.includes('not authenticated')) {
    return 'Sesi login Anda sudah berakhir. Silakan login kembali.';
  }

  return message || 'Booking gagal dibuat. Silakan coba lagi.';
}