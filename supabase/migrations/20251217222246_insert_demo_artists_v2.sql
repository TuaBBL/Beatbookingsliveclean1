/*
  # Insert Demo Artists from Mock Data
  
  1. Purpose
    - Populate the database with demo artists from mockArtists.ts
    - These are sample artists for browsing and testing
    - Marked with type='demo' to distinguish from real artists
    - Do not require user accounts (user_id is null)
  
  2. Data Inserted
    - 12 demo artist profiles with:
      - Stage names, genres, categories, locations
      - Bio descriptions
      - type='demo' marker
      - External image URLs from Pexels
  
  3. Artists Included
    - Neon Pulse (Electronic, DJ, Sydney)
    - Bass Empire (Bass Music, Producer, Melbourne)
    - Aurora Beats (House, DJ, Brisbane)
    - Voltage Sound (Techno, Live Act, Perth)
    - Crimson Wave (Drum & Bass, DJ, Adelaide)
    - Echo Chamber (Ambient, Producer, Gold Coast)
    - Riptide Records (Trance, DJ, Canberra)
    - Static Dreams (Progressive, Live Act, Hobart)
    - 频率 Frequency (Deep House, DJ, Darwin)
    - Sonic Drift (Dubstep, Producer, Newcastle)
    - Wave Theory (Minimal, DJ, Wollongong)
    - Midnight Cascade (Hip Hop, Live Act, Geelong)
  
  4. Notes
    - Uses fixed UUIDs as primary keys for idempotent inserts
    - user_id is null for all demo artists
    - Images use external Pexels URLs (not stored in Supabase storage)
*/

-- Insert demo artist profiles (if they don't exist)
INSERT INTO artist_profiles (id, user_id, stage_name, genre, category, location, type, is_featured, is_premium, bio, created_at)
VALUES
  ('10000000-0000-0000-0000-000000000001', NULL, 'Neon Pulse', 'Electronic', 'DJ', 'Sydney, NSW, Australia', 'demo', false, false, 'Electronic music pioneer bringing cutting-edge sounds to the dance floor.', now()),
  ('10000000-0000-0000-0000-000000000002', NULL, 'Bass Empire', 'Bass Music', 'Producer', 'Melbourne, VIC, Australia', 'demo', false, false, 'Bass music producer crafting heavy drops and infectious rhythms.', now()),
  ('10000000-0000-0000-0000-000000000003', NULL, 'Aurora Beats', 'House', 'DJ', 'Brisbane, QLD, Australia', 'demo', false, false, 'House DJ spinning groovy tracks that keep the energy high all night.', now()),
  ('10000000-0000-0000-0000-000000000004', NULL, 'Voltage Sound', 'Techno', 'Live Act', 'Perth, WA, Australia', 'demo', false, false, 'Techno live act delivering powerful performances with custom hardware.', now()),
  ('10000000-0000-0000-0000-000000000005', NULL, 'Crimson Wave', 'Drum & Bass', 'DJ', 'Adelaide, SA, Australia', 'demo', false, false, 'Drum & Bass specialist known for rapid-fire mixing and high-energy sets.', now()),
  ('10000000-0000-0000-0000-000000000006', NULL, 'Echo Chamber', 'Ambient', 'Producer', 'Gold Coast, QLD, Australia', 'demo', false, false, 'Ambient producer creating atmospheric soundscapes and ethereal textures.', now()),
  ('10000000-0000-0000-0000-000000000007', NULL, 'Riptide Records', 'Trance', 'DJ', 'Canberra, ACT, Australia', 'demo', false, false, 'Trance DJ delivering uplifting melodies and euphoric journeys.', now()),
  ('10000000-0000-0000-0000-000000000008', NULL, 'Static Dreams', 'Progressive', 'Live Act', 'Hobart, TAS, Australia', 'demo', false, false, 'Progressive live act blending deep grooves with evolving soundscapes.', now()),
  ('10000000-0000-0000-0000-000000000009', NULL, '频率 Frequency', 'Deep House', 'DJ', 'Darwin, NT, Australia', 'demo', false, false, 'Deep House DJ mixing smooth basslines and soulful vocals.', now()),
  ('10000000-0000-0000-0000-000000000010', NULL, 'Sonic Drift', 'Dubstep', 'Producer', 'Newcastle, NSW, Australia', 'demo', false, false, 'Dubstep producer known for massive wobbles and earth-shaking bass.', now()),
  ('10000000-0000-0000-0000-000000000011', NULL, 'Wave Theory', 'Minimal', 'DJ', 'Wollongong, NSW, Australia', 'demo', false, false, 'Minimal DJ crafting hypnotic sets with precise track selection.', now()),
  ('10000000-0000-0000-0000-000000000012', NULL, 'Midnight Cascade', 'Hip Hop', 'Live Act', 'Geelong, VIC, Australia', 'demo', false, false, 'Hip Hop live act bringing dynamic performances and authentic vibes.', now())
ON CONFLICT (id) DO NOTHING;