/*
  # Update Demo Artist Images
  
  1. Purpose
    - Add image URLs to demo artist profiles
    - Images are from Pexels stock photos
  
  2. Updates
    - Sets image_url for all 12 demo artists
    - Matches the images from mockArtists.ts
*/

-- Update demo artists with their image URLs
UPDATE artist_profiles SET image_url = 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=400' WHERE id = '10000000-0000-0000-0000-000000000001';
UPDATE artist_profiles SET image_url = 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=400' WHERE id = '10000000-0000-0000-0000-000000000002';
UPDATE artist_profiles SET image_url = 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=400' WHERE id = '10000000-0000-0000-0000-000000000003';
UPDATE artist_profiles SET image_url = 'https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg?auto=compress&cs=tinysrgb&w=400' WHERE id = '10000000-0000-0000-0000-000000000004';
UPDATE artist_profiles SET image_url = 'https://images.pexels.com/photos/2111015/pexels-photo-2111015.jpeg?auto=compress&cs=tinysrgb&w=400' WHERE id = '10000000-0000-0000-0000-000000000005';
UPDATE artist_profiles SET image_url = 'https://images.pexels.com/photos/1699161/pexels-photo-1699161.jpeg?auto=compress&cs=tinysrgb&w=400' WHERE id = '10000000-0000-0000-0000-000000000006';
UPDATE artist_profiles SET image_url = 'https://images.pexels.com/photos/1763067/pexels-photo-1763067.jpeg?auto=compress&cs=tinysrgb&w=400' WHERE id = '10000000-0000-0000-0000-000000000007';
UPDATE artist_profiles SET image_url = 'https://images.pexels.com/photos/1644888/pexels-photo-1644888.jpeg?auto=compress&cs=tinysrgb&w=400' WHERE id = '10000000-0000-0000-0000-000000000008';
UPDATE artist_profiles SET image_url = 'https://images.pexels.com/photos/1864642/pexels-photo-1864642.jpeg?auto=compress&cs=tinysrgb&w=400' WHERE id = '10000000-0000-0000-0000-000000000009';
UPDATE artist_profiles SET image_url = 'https://images.pexels.com/photos/1587927/pexels-photo-1587927.jpeg?auto=compress&cs=tinysrgb&w=400' WHERE id = '10000000-0000-0000-0000-000000000010';
UPDATE artist_profiles SET image_url = 'https://images.pexels.com/photos/1708912/pexels-photo-1708912.jpeg?auto=compress&cs=tinysrgb&w=400' WHERE id = '10000000-0000-0000-0000-000000000011';
UPDATE artist_profiles SET image_url = 'https://images.pexels.com/photos/2479312/pexels-photo-2479312.jpeg?auto=compress&cs=tinysrgb&w=400' WHERE id = '10000000-0000-0000-0000-000000000012';