/**
 * Media Upload Limits Utility
 *
 * Centralized logic for tier-based media upload limits.
 * This ensures consistent behavior across all components.
 */

export interface MediaLimits {
  images: number;
  videos: number;
  videoMaxSize: number | null;
  imageMaxSize: number;
}

export interface SubscriptionTier {
  entitlement_tier?: string;
  is_active?: boolean;
}

/**
 * Get media upload limits based on subscription tier
 *
 * Premium/Free Forever: 30 images, 10 videos, unlimited video size
 * Standard/Free: 20 images, 5 videos, 100MB video limit
 */
export function getMediaLimits(subscription: SubscriptionTier | null): MediaLimits {
  const tier = subscription?.entitlement_tier || 'free';
  const isActive = subscription?.is_active !== false;
  const isPremium = (tier === 'premium' || tier === 'free_forever') && isActive;

  if (isPremium) {
    return {
      images: 30,
      videos: 10,
      videoMaxSize: null, // Unlimited up to 500MB absolute max
      imageMaxSize: 10 * 1024 * 1024, // 10MB
    };
  }

  return {
    images: 20,
    videos: 5,
    videoMaxSize: 100 * 1024 * 1024, // 100MB
    imageMaxSize: 10 * 1024 * 1024, // 10MB
  };
}

/**
 * Check if user has premium tier subscription
 */
export function isPremiumTier(subscription: SubscriptionTier | null): boolean {
  const tier = subscription?.entitlement_tier || 'free';
  const isActive = subscription?.is_active !== false;
  return (tier === 'premium' || tier === 'free_forever') && isActive;
}

/**
 * Format file size in bytes to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get user-friendly error message when upload limit is reached
 * Includes upgrade prompts for non-premium users
 */
export function getUploadErrorMessage(
  type: 'image' | 'video',
  currentCount: number,
  limit: number,
  isPremium: boolean
): string {
  if (type === 'image') {
    const upgradeMsg = !isPremium
      ? ' Upgrade to Premium for up to 30 images.'
      : '';
    return `Image limit reached: ${limit} maximum.${upgradeMsg} Delete existing images to upload new ones.`;
  } else {
    const upgradeMsg = !isPremium
      ? ' Upgrade to Premium for unlimited video size and up to 10 videos.'
      : '';
    return `Video limit reached: ${limit} maximum.${upgradeMsg} Delete existing videos to upload new ones.`;
  }
}

/**
 * Validate file size and return error message if invalid
 * Returns null if file size is valid
 */
export function getFileSizeErrorMessage(
  type: 'image' | 'video',
  fileSize: number,
  isPremium: boolean
): string | null {
  if (type === 'image') {
    const maxSize = 10 * 1024 * 1024;
    if (fileSize > maxSize) {
      return `Image size must be less than ${formatFileSize(maxSize)}`;
    }
  } else if (type === 'video') {
    // Absolute maximum for all users (infrastructure limit)
    const absoluteMaxSize = 500 * 1024 * 1024;
    // Standard tier limit
    const standardMaxSize = 100 * 1024 * 1024;

    if (fileSize > absoluteMaxSize) {
      return `Video size must be less than ${formatFileSize(absoluteMaxSize)}. Please compress your video.`;
    }

    if (!isPremium && fileSize > standardMaxSize) {
      return `Video size must be less than ${formatFileSize(standardMaxSize)} for Standard users. Upgrade to Premium for unlimited video size.`;
    }
  }

  return null;
}
