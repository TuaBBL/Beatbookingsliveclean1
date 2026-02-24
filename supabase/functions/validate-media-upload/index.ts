/**
 * Validate Media Upload Edge Function
 *
 * Provides server-side validation for media uploads.
 * This is the authoritative validation layer that cannot be bypassed.
 *
 * Features:
 * - JWT authentication required
 * - Artist profile ownership verification
 * - Calls database validation function
 * - Returns structured validation results
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ValidateRequest {
  artist_id: string;
  media_type: 'image' | 'video';
  file_size?: number;
}

interface ValidationResult {
  allowed: boolean;
  message: string;
  current_count?: number;
  limit?: number;
  tier?: string;
  is_premium?: boolean;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const { artist_id, media_type, file_size }: ValidateRequest = await req.json();

    // Validate required fields
    if (!artist_id || !media_type) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          required: ["artist_id", "media_type"]
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate media type
    if (media_type !== 'image' && media_type !== 'video') {
      return new Response(
        JSON.stringify({
          error: "Invalid media_type",
          message: 'media_type must be "image" or "video"'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify user owns the artist profile
    const { data: artistProfile } = await supabase
      .from("artist_profiles")
      .select("id")
      .eq("id", artist_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!artistProfile) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "Artist profile not found or you don't have permission to access it"
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Call database validation function
    const { data: validationResult, error: validationError } = await supabase
      .rpc("validate_media_upload_limits", {
        p_artist_id: artist_id,
        p_media_type: media_type,
        p_file_size: file_size || null,
      });

    if (validationError) {
      console.error("Validation error:", validationError);
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Return validation result
    const result = validationResult as ValidationResult;

    return new Response(
      JSON.stringify(result),
      {
        status: result.allowed ? 200 : 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in validate-media-upload:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
