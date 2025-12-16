import { supabase } from "@/lib/supabase";

/**
 * Base select used everywhere events are fetched
 * DO NOT inline event queries elsewhere
 */
const EVENT_SELECT = `
  id,
  title,
  type,
  country,
  state,
  city,
  event_date,
  event_end_date,
  start_time,
  end_time,
  venue,
  cost,
  cover_image,
  description,
  external_link,
  ticket_link,
  status,
  created_at,

  profiles:creator_id (
    id,
    display_name,
    role,
    avatar_url
  )
`;

/**
 * Public events (published only)
 */
export async function fetchPublishedEvents({
  limit = 6,
  fromDate,
}: {
  limit?: number;
  fromDate?: string;
}) {
  let query = supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("status", "published")
    .order("event_date", { ascending: true })
    .limit(limit);

  if (fromDate) {
    query = query.gte("event_date", fromDate);
  }

  return query;
}

/**
 * Events owned by the logged-in creator (draft + published)
 */
export async function fetchMyEvents() {
  return supabase
    .from("events")
    .select(EVENT_SELECT)
    .order("created_at", { ascending: false });
}

/**
 * Single event by ID (respects RLS automatically)
 */
export async function fetchEventById(eventId: string) {
  return supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("id", eventId)
    .single();
}
