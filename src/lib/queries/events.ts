import { supabase } from "../supabase";

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
    .maybeSingle();
}

/**
 * Events within a date range (published only)
 */
export async function fetchEventsInDateRange({
  startDate,
  endDate,
  limit,
}: {
  startDate: string;
  endDate: string;
  limit?: number;
}) {
  let query = supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("status", "published")
    .gte("event_date", startDate)
    .lte("event_date", endDate)
    .order("event_date", { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  return query;
}

/**
 * Count published events by creator
 */
export async function countPublishedEventsByUser(userId: string) {
  return supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", userId)
    .eq("status", "published");
}

/**
 * Events by creator (all statuses)
 */
export async function fetchEventsByCreator(userId: string) {
  return supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("creator_id", userId)
    .order("event_date", { ascending: true });
}

/**
 * Create a new event
 */
export async function createEvent(eventData: any) {
  return supabase
    .from("events")
    .insert([eventData])
    .select(EVENT_SELECT)
    .single();
}

/**
 * Update an existing event
 */
export async function updateEvent(eventId: string, eventData: any) {
  return supabase
    .from("events")
    .update(eventData)
    .eq("id", eventId)
    .select(EVENT_SELECT)
    .single();
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId: string) {
  return supabase
    .from("events")
    .delete()
    .eq("id", eventId);
}
