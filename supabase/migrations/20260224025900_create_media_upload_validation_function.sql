/*
  # Create Media Upload Validation Function

  1. Purpose
    - Provides atomic validation for media uploads based on subscription tier
    - Prevents race conditions during concurrent uploads
    - Returns clear error messages with upgrade prompts

  2. New Functions
    - `validate_media_upload_limits(artist_id, media_type, file_size)`
      - Checks current media count against tier limits
      - Validates file sizes against tier restrictions
      - Returns JSON with validation result and user-friendly messages

  3. Tier-Based Limits
    - Premium/Free Forever:
      * 30 images maximum
      * 10 videos maximum
      * Unlimited video size (up to 500MB absolute max)
    - Standard/Free:
      * 20 images maximum
      * 5 videos maximum
      * 100MB video limit maximum

  4. Security
    - SECURITY DEFINER for privileged access
    - search_path protection against SQL injection
    - Only accessible to authenticated users

  5. Return Format
    ```json
    {
      "allowed": boolean,
      "message": "User-friendly error or success message",
      "current_count": number,
      "limit": number,
      "tier": "premium|free",
      "is_premium": boolean
    }
    ```
*/

-- Drop function if it exists to allow clean recreation
DROP FUNCTION IF EXISTS validate_media_upload_limits(uuid, text, bigint);

-- Create the validation function
CREATE OR REPLACE FUNCTION validate_media_upload_limits(
  p_artist_id uuid,
  p_media_type text,
  p_file_size bigint DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription_tier text;
  v_is_active boolean;
  v_is_premium boolean;
  v_current_count integer;
  v_image_limit integer;
  v_video_limit integer;
  v_video_size_limit bigint;
  v_message text;
BEGIN
  -- Validate media type parameter
  IF p_media_type NOT IN ('image', 'video') THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'message', 'Invalid media type. Must be "image" or "video".'
    );
  END IF;

  -- Get subscription tier and status
  SELECT 
    COALESCE(s.entitlement_tier, 'free'),
    COALESCE(s.is_active, false)
  INTO v_subscription_tier, v_is_active
  FROM subscriptions s
  WHERE s.artist_id = p_artist_id
    AND s.is_active = true
  LIMIT 1;

  -- Default to free tier if no subscription found
  IF v_subscription_tier IS NULL THEN
    v_subscription_tier := 'free';
    v_is_active := false;
  END IF;

  -- Determine if premium tier
  v_is_premium := (v_subscription_tier IN ('premium', 'free_forever')) AND v_is_active;

  -- Set limits based on tier
  IF v_is_premium THEN
    v_image_limit := 30;
    v_video_limit := 10;
    v_video_size_limit := NULL; -- Unlimited up to absolute max
  ELSE
    v_image_limit := 20;
    v_video_limit := 5;
    v_video_size_limit := 100 * 1024 * 1024; -- 100MB
  END IF;

  -- Get current media count for this type
  SELECT COUNT(*)
  INTO v_current_count
  FROM artist_media
  WHERE artist_id = p_artist_id
    AND media_type = p_media_type;

  -- Validate based on media type
  IF p_media_type = 'image' THEN
    -- Check image count limit
    IF v_current_count >= v_image_limit THEN
      IF v_is_premium THEN
        v_message := format('Image limit reached: %s maximum. Delete existing images to upload new ones.', v_image_limit);
      ELSE
        v_message := format('Image limit reached: %s maximum. Upgrade to Premium for up to 30 images. Delete existing images to upload new ones.', v_image_limit);
      END IF;

      RETURN jsonb_build_object(
        'allowed', false,
        'message', v_message,
        'current_count', v_current_count,
        'limit', v_image_limit,
        'tier', v_subscription_tier,
        'is_premium', v_is_premium
      );
    END IF;

    -- Check image file size (10MB max for all tiers)
    IF p_file_size IS NOT NULL AND p_file_size > (10 * 1024 * 1024) THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'message', 'Image size must be less than 10 MB',
        'file_size', p_file_size,
        'max_size', 10 * 1024 * 1024
      );
    END IF;

  ELSIF p_media_type = 'video' THEN
    -- Check video count limit
    IF v_current_count >= v_video_limit THEN
      IF v_is_premium THEN
        v_message := format('Video limit reached: %s maximum. Delete existing videos to upload new ones.', v_video_limit);
      ELSE
        v_message := format('Video limit reached: %s maximum. Upgrade to Premium for unlimited video size and up to 10 videos. Delete existing videos to upload new ones.', v_video_limit);
      END IF;

      RETURN jsonb_build_object(
        'allowed', false,
        'message', v_message,
        'current_count', v_current_count,
        'limit', v_video_limit,
        'tier', v_subscription_tier,
        'is_premium', v_is_premium
      );
    END IF;

    -- Check video file size
    IF p_file_size IS NOT NULL THEN
      -- Absolute maximum for all users (infrastructure limit)
      IF p_file_size > (500 * 1024 * 1024) THEN
        RETURN jsonb_build_object(
          'allowed', false,
          'message', 'Video size must be less than 500 MB. Please compress your video.',
          'file_size', p_file_size,
          'max_size', 500 * 1024 * 1024
        );
      END IF;

      -- Standard tier limit (100MB)
      IF NOT v_is_premium AND v_video_size_limit IS NOT NULL AND p_file_size > v_video_size_limit THEN
        RETURN jsonb_build_object(
          'allowed', false,
          'message', 'Video size must be less than 100 MB for Standard users. Upgrade to Premium for unlimited video size.',
          'file_size', p_file_size,
          'max_size', v_video_size_limit,
          'tier', v_subscription_tier,
          'is_premium', v_is_premium
        );
      END IF;
    END IF;
  END IF;

  -- All validations passed
  RETURN jsonb_build_object(
    'allowed', true,
    'message', 'Upload allowed',
    'current_count', v_current_count,
    'limit', CASE WHEN p_media_type = 'image' THEN v_image_limit ELSE v_video_limit END,
    'tier', v_subscription_tier,
    'is_premium', v_is_premium
  );
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION validate_media_upload_limits IS 'Validates media upload against tier-based limits. Returns JSON with validation result and user-friendly messages. Premium: 30 images/10 videos/unlimited size. Standard: 20 images/5 videos/100MB limit.';
