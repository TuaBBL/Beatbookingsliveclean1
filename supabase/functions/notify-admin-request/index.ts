import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  try {
    const payload = await req.json();

    const profile = payload.record;

    // Only act on admin requests
    if (!profile?.admin_requested) {
      return new Response("No admin request", { status: 200 });
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BeatBookingsLive <info@beatbookingslive.com>",
        to: ["genetua@gtrax.net"],
        subject: "Admin access requested",
        html: `
          <h2>New Admin Request</h2>
          <p><strong>Name:</strong> ${profile.name}</p>
          <p><strong>Email:</strong> ${profile.email}</p>
          <p><strong>Role selected:</strong> Admin (pending)</p>
          <p><strong>User ID:</strong> ${profile.id}</p>
          <br/>
          <p>Approve manually in Supabase.</p>
        `,
      }),
    });

    if (!resendRes.ok) {
      const text = await resendRes.text();
      console.error("Resend error:", text);
      return new Response("Email failed", { status: 500 });
    }

    return new Response("Admin request email sent", { status: 200 });
  } catch (err) {
    console.error("notify-admin-request error:", err);
    return new Response("Server error", { status: 500 });
  }
});
