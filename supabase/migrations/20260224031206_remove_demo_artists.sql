/*
  # Remove Demo Artists from Database

  1. Summary
    - Remove all placeholder/demo artist profiles from the system
    - Clean up associated data (social links, reviews, media, etc.)
    - Keep only verified real artists with authentic profiles

  2. Demo Artists Being Removed (12 total)
    - Neon Pulse (Electronic)
    - Bass Empire (Bass Music)
    - Aurora Beats (House)
    - Voltage Sound (Techno)
    - Crimson Wave (Drum & Bass)
    - Echo Chamber (Ambient)
    - Riptide Records (Trance)
    - Static Dreams (Progressive)
    - 频率 Frequency (Deep House)
    - Sonic Drift (Dubstep)
    - Wave Theory (Minimal)
    - Midnight Cascade (Hip Hop)

  3. Real Artists Being Kept (4 total)
    - DJ Tua (Brisbane)
    - DJ SI1 (Perth)
    - DjBeau_Brisbane (Brisbane)
    - The Curator (Gold Coast)

  4. Related Data Cleanup
    - Artist social links for demo artists (30+ records)
    - Artist reviews for demo artists
    - Artist media for demo artists
    - Artist availability for demo artists
    - Artist profile views for demo artists
    - Favourites referencing demo artists
    - Booking requests for demo artists
    - Music pool links for demo artists
    - Monthly analytics for demo artists

  5. Impact
    - Database will only contain authentic, verified artist profiles
    - Homepage and search will display real artists only
    - Improved credibility and professional appearance
    - 12 demo profiles removed, 4 real profiles retained
*/

-- Delete related data first (foreign key constraints)

-- Delete artist social links for demo artists
DELETE FROM artist_social_links
WHERE artist_id IN (
  SELECT id FROM artist_profiles WHERE type = 'demo'
);

-- Delete artist reviews for demo artists
DELETE FROM artist_reviews
WHERE artist_id IN (
  SELECT id FROM artist_profiles WHERE type = 'demo'
);

-- Delete artist media for demo artists
DELETE FROM artist_media
WHERE artist_id IN (
  SELECT id FROM artist_profiles WHERE type = 'demo'
);

-- Delete artist availability for demo artists
DELETE FROM artist_availability
WHERE artist_id IN (
  SELECT id FROM artist_profiles WHERE type = 'demo'
);

-- Delete artist profile views for demo artists
DELETE FROM artist_profile_views
WHERE artist_id IN (
  SELECT id FROM artist_profiles WHERE type = 'demo'
);

-- Delete monthly analytics for demo artists
DELETE FROM analytics_monthly
WHERE artist_id IN (
  SELECT id FROM artist_profiles WHERE type = 'demo'
);

-- Delete featured artists entries for demo artists
DELETE FROM featured_artists
WHERE artist_id IN (
  SELECT id FROM artist_profiles WHERE type = 'demo'
);

-- Delete favourites referencing demo artists
DELETE FROM favourites
WHERE artist_id IN (
  SELECT id FROM artist_profiles WHERE type = 'demo'
);

-- Delete booking requests for demo artists
DELETE FROM booking_requests
WHERE artist_id IN (
  SELECT id FROM artist_profiles WHERE type = 'demo'
);

-- Delete music pool links for demo artists
DELETE FROM music_pool_links
WHERE artist_id IN (
  SELECT id FROM artist_profiles WHERE type = 'demo'
);

-- Delete subscriptions for demo artists
DELETE FROM subscriptions
WHERE artist_id IN (
  SELECT id FROM artist_profiles WHERE type = 'demo'
);

-- Finally, delete the demo artist profiles themselves
DELETE FROM artist_profiles
WHERE type = 'demo';
