import { supabase } from "../supabase";

export async function canPublishEvent({
  creatorRole,
}: {
  creatorRole: "artist" | "planner";
}) {
  if (creatorRole === "artist") {
    return { allowed: true, requiresPayment: false };
  }

  const { count, error } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  if (error) throw error;

  if (count === 0) {
    return { allowed: true, requiresPayment: false };
  }

  return { allowed: false, requiresPayment: true };
}
