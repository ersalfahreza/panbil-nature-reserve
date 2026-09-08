export type ActivityStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

export type PricingType = 'PER_PERSON' | 'FLAT_GROUP' | 'PER_UNIT';

export type ActivityRuleType =
  | 'AGE_RESTRICTION'
  | 'REQUIRED_FIELD'
  | 'SAFETY_GEAR'
  | 'TERMS_AND_CONDITIONS';

export interface ActivityCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityImage {
  id: string;
  activity_id: string;
  image_url: string;
  caption: string | null;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface ActivityPricing {
  id: string;
  activity_id: string;
  pricing_name: string;
  price: number;
  pricing_type: PricingType;
  valid_from: string | null;
  valid_to: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityRule {
  id: string;
  activity_id: string;
  rule_type: ActivityRuleType;
  min_age: number | null;
  max_age: number | null;
  field_name: string | null;
  rule_description: string;
  is_mandatory: boolean;
  created_at: string;
}

export interface Activity {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  duration_minutes: number;
  min_participants: number;
  max_participants: number;
  requires_timeslot: boolean;
  status: ActivityStatus;
  created_at: string;
  updated_at: string;

  category?: ActivityCategory;
  images?: ActivityImage[];
  pricing?: ActivityPricing[];
  rules?: ActivityRule[];
}

export interface ActivityListItem extends Activity {
  category: ActivityCategory;
  primary_image: ActivityImage | null;
  current_price: ActivityPricing | null;
}

export interface ActivityDetail extends Activity {
  category: ActivityCategory;
  images: ActivityImage[];
  pricing: ActivityPricing[];
  rules: ActivityRule[];
}