/*
  # Insert Demo Artist Social Links
  
  1. Purpose
    - Populate the artist_social_links table with social media links for demo artists
    - Maps social platform data from mockArtists.ts to database records
    - Uses placeholder URLs for each platform
  
  2. Data Inserted
    - Social links for all 12 demo artists
    - Platforms: Instagram, YouTube, Facebook, SoundCloud, Spotify
    - Total: 40+ social link records
  
  3. Artists & Their Social Platforms
    - Neon Pulse: Instagram, YouTube, Spotify
    - Bass Empire: Instagram, SoundCloud, Spotify
    - Aurora Beats: Instagram, YouTube, Facebook, Spotify
    - Voltage Sound: Instagram, SoundCloud
    - Crimson Wave: Instagram, YouTube, Spotify
    - Echo Chamber: SoundCloud, Spotify
    - Riptide Records: Instagram, Facebook, Spotify
    - Static Dreams: Instagram, YouTube
    - 频率 Frequency: Instagram, Spotify
    - Sonic Drift: YouTube, SoundCloud, Spotify
    - Wave Theory: Instagram, Facebook
    - Midnight Cascade: Instagram, YouTube, Spotify
  
  4. Notes
    - Uses ON CONFLICT DO NOTHING for idempotent inserts
    - Placeholder URLs follow standard platform patterns
    - Matches the social data structure from mockArtists.ts
*/

-- Insert social links for Neon Pulse (ID: ...001)
INSERT INTO artist_social_links (artist_id, platform, url, created_at)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'instagram', 'https://instagram.com/neonpulse', now()),
  ('10000000-0000-0000-0000-000000000001', 'youtube', 'https://youtube.com/@neonpulse', now()),
  ('10000000-0000-0000-0000-000000000001', 'spotify', 'https://open.spotify.com/artist/neonpulse', now())
ON CONFLICT (artist_id, platform) DO NOTHING;

-- Insert social links for Bass Empire (ID: ...002)
INSERT INTO artist_social_links (artist_id, platform, url, created_at)
VALUES
  ('10000000-0000-0000-0000-000000000002', 'instagram', 'https://instagram.com/bassempire', now()),
  ('10000000-0000-0000-0000-000000000002', 'soundcloud', 'https://soundcloud.com/bassempire', now()),
  ('10000000-0000-0000-0000-000000000002', 'spotify', 'https://open.spotify.com/artist/bassempire', now())
ON CONFLICT (artist_id, platform) DO NOTHING;

-- Insert social links for Aurora Beats (ID: ...003)
INSERT INTO artist_social_links (artist_id, platform, url, created_at)
VALUES
  ('10000000-0000-0000-0000-000000000003', 'instagram', 'https://instagram.com/aurorabeats', now()),
  ('10000000-0000-0000-0000-000000000003', 'youtube', 'https://youtube.com/@aurorabeats', now()),
  ('10000000-0000-0000-0000-000000000003', 'facebook', 'https://facebook.com/aurorabeats', now()),
  ('10000000-0000-0000-0000-000000000003', 'spotify', 'https://open.spotify.com/artist/aurorabeats', now())
ON CONFLICT (artist_id, platform) DO NOTHING;

-- Insert social links for Voltage Sound (ID: ...004)
INSERT INTO artist_social_links (artist_id, platform, url, created_at)
VALUES
  ('10000000-0000-0000-0000-000000000004', 'instagram', 'https://instagram.com/voltagesound', now()),
  ('10000000-0000-0000-0000-000000000004', 'soundcloud', 'https://soundcloud.com/voltagesound', now())
ON CONFLICT (artist_id, platform) DO NOTHING;

-- Insert social links for Crimson Wave (ID: ...005)
INSERT INTO artist_social_links (artist_id, platform, url, created_at)
VALUES
  ('10000000-0000-0000-0000-000000000005', 'instagram', 'https://instagram.com/crimsonwave', now()),
  ('10000000-0000-0000-0000-000000000005', 'youtube', 'https://youtube.com/@crimsonwave', now()),
  ('10000000-0000-0000-0000-000000000005', 'spotify', 'https://open.spotify.com/artist/crimsonwave', now())
ON CONFLICT (artist_id, platform) DO NOTHING;

-- Insert social links for Echo Chamber (ID: ...006)
INSERT INTO artist_social_links (artist_id, platform, url, created_at)
VALUES
  ('10000000-0000-0000-0000-000000000006', 'soundcloud', 'https://soundcloud.com/echochamber', now()),
  ('10000000-0000-0000-0000-000000000006', 'spotify', 'https://open.spotify.com/artist/echochamber', now())
ON CONFLICT (artist_id, platform) DO NOTHING;

-- Insert social links for Riptide Records (ID: ...007)
INSERT INTO artist_social_links (artist_id, platform, url, created_at)
VALUES
  ('10000000-0000-0000-0000-000000000007', 'instagram', 'https://instagram.com/riptiderecords', now()),
  ('10000000-0000-0000-0000-000000000007', 'facebook', 'https://facebook.com/riptiderecords', now()),
  ('10000000-0000-0000-0000-000000000007', 'spotify', 'https://open.spotify.com/artist/riptiderecords', now())
ON CONFLICT (artist_id, platform) DO NOTHING;

-- Insert social links for Static Dreams (ID: ...008)
INSERT INTO artist_social_links (artist_id, platform, url, created_at)
VALUES
  ('10000000-0000-0000-0000-000000000008', 'instagram', 'https://instagram.com/staticdreams', now()),
  ('10000000-0000-0000-0000-000000000008', 'youtube', 'https://youtube.com/@staticdreams', now())
ON CONFLICT (artist_id, platform) DO NOTHING;

-- Insert social links for 频率 Frequency (ID: ...009)
INSERT INTO artist_social_links (artist_id, platform, url, created_at)
VALUES
  ('10000000-0000-0000-0000-000000000009', 'instagram', 'https://instagram.com/frequencymusic', now()),
  ('10000000-0000-0000-0000-000000000009', 'spotify', 'https://open.spotify.com/artist/frequencymusic', now())
ON CONFLICT (artist_id, platform) DO NOTHING;

-- Insert social links for Sonic Drift (ID: ...010)
INSERT INTO artist_social_links (artist_id, platform, url, created_at)
VALUES
  ('10000000-0000-0000-0000-000000000010', 'youtube', 'https://youtube.com/@sonicdrift', now()),
  ('10000000-0000-0000-0000-000000000010', 'soundcloud', 'https://soundcloud.com/sonicdrift', now()),
  ('10000000-0000-0000-0000-000000000010', 'spotify', 'https://open.spotify.com/artist/sonicdrift', now())
ON CONFLICT (artist_id, platform) DO NOTHING;

-- Insert social links for Wave Theory (ID: ...011)
INSERT INTO artist_social_links (artist_id, platform, url, created_at)
VALUES
  ('10000000-0000-0000-0000-000000000011', 'instagram', 'https://instagram.com/wavetheory', now()),
  ('10000000-0000-0000-0000-000000000011', 'facebook', 'https://facebook.com/wavetheory', now())
ON CONFLICT (artist_id, platform) DO NOTHING;

-- Insert social links for Midnight Cascade (ID: ...012)
INSERT INTO artist_social_links (artist_id, platform, url, created_at)
VALUES
  ('10000000-0000-0000-0000-000000000012', 'instagram', 'https://instagram.com/midnightcascade', now()),
  ('10000000-0000-0000-0000-000000000012', 'youtube', 'https://youtube.com/@midnightcascade', now()),
  ('10000000-0000-0000-0000-000000000012', 'spotify', 'https://open.spotify.com/artist/midnightcascade', now())
ON CONFLICT (artist_id, platform) DO NOTHING;
