import { supabase } from '@/lib/supabase';
import type {
  Activity,
  ActivityCategory,
  ActivityDetail,
  ActivityListItem,
} from '../types/activity.types';

export async function getActiveActivities(): Promise<ActivityListItem[]> {
  const { data, error } = await supabase
    .from('activities')
    .select(`
      id,
      category_id,
      name,
      slug,
      description,
      duration_minutes,
      min_participants,
      max_participants,
      requires_timeslot,
      status,
      created_at,
      updated_at,
      category:activity_categories (
        id,
        name,
        slug,
        description,
        display_order,
        created_at,
        updated_at
      ),
      images:activity_images (
        id,
        activity_id,
        image_url,
        caption,
        is_primary,
        display_order,
        created_at
      ),
      pricing:activity_pricing (
        id,
        activity_id,
        pricing_name,
        price,
        pricing_type,
        valid_from,
        valid_to,
        is_active,
        created_at,
        updated_at
      )
    `)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('GET ACTIVE ACTIVITIES ERROR:', error);
    throw error;
  }

  return (data ?? []).map((activity) => {
    const images = [...(activity.images ?? [])].sort(
      (a, b) => a.display_order - b.display_order,
    );

    const pricing = [...(activity.pricing ?? [])]
      .filter((item) => item.is_active)
      .sort((a, b) => a.price - b.price);

    return {
      ...activity,
      category: Array.isArray(activity.category)
  ? activity.category[0]
  : activity.category,
      images,
      pricing,
      primary_image:
        images.find((image) => image.is_primary) ?? images[0] ?? null,
      current_price: pricing[0] ?? null,
    };
  }) as ActivityListItem[];
}

export async function getActivityBySlug(
  slug: string,
): Promise<ActivityDetail | null> {
  const { data, error } = await supabase
    .from('activities')
    .select(`
      id,
      category_id,
      name,
      slug,
      description,
      duration_minutes,
      min_participants,
      max_participants,
      requires_timeslot,
      status,
      created_at,
      updated_at,
      category:activity_categories (
        id,
        name,
        slug,
        description,
        display_order,
        created_at,
        updated_at
      ),
      images:activity_images (
        id,
        activity_id,
        image_url,
        caption,
        is_primary,
        display_order,
        created_at
      ),
      pricing:activity_pricing (
        id,
        activity_id,
        pricing_name,
        price,
        pricing_type,
        valid_from,
        valid_to,
        is_active,
        created_at,
        updated_at
      ),
      rules:activity_rules (
        id,
        activity_id,
        rule_type,
        min_age,
        max_age,
        field_name,
        rule_description,
        is_mandatory,
        created_at
      )
    `)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('GET ACTIVITY BY SLUG ERROR:', error);
    throw error;
  }

  if (!data) {
    return null;
  }

  const images = [...(data.images ?? [])].sort(
    (a, b) => a.display_order - b.display_order,
  );

  const pricing = [...(data.pricing ?? [])]
    .filter((item) => item.is_active)
    .sort((a, b) => a.price - b.price);

  const rules = [...(data.rules ?? [])];

  return {
    ...data,
    category: Array.isArray(data.category)
  ? data.category[0]
  : data.category,
    images,
    pricing,
    rules,
  } as ActivityDetail;
}

export async function getActivityCategories(): Promise<ActivityCategory[]> {
  const { data, error } = await supabase
    .from('activity_categories')
    .select(`
      id,
      name,
      slug,
      description,
      display_order,
      created_at,
      updated_at
    `)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('GET ACTIVITY CATEGORIES ERROR:', error);
    throw error;
  }

  return data ?? [];
}

export async function getActivityById(
  id: string,
): Promise<Activity | null> {
  const { data, error } = await supabase
    .from('activities')
    .select(`
      id,
      category_id,
      name,
      slug,
      description,
      duration_minutes,
      min_participants,
      max_participants,
      requires_timeslot,
      status,
      created_at,
      updated_at
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('GET ACTIVITY BY ID ERROR:', error);
    throw error;
  }

  return data as Activity | null;
}