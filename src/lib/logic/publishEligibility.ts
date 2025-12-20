import { supabase } from "../supabase";

export async function canPublishEvent({
  creatorRole,
  creatorId,
}: {
  creatorRole: "artist" | "planner";
  creatorId: string;
}) {
  if (creatorRole === "artist") {
    return { allowed: true, requiresPayment: false };
  }

  const { count, error } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", creatorId)
    .eq("status", "published");

  if (error) throw error;

  if (count === 0) {
    return { allowed: true, requiresPayment: false };
  }

  return { allowed: false, requiresPayment: true };
}
