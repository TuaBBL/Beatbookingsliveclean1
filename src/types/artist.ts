// This matches the artist_profiles table 1:1
export interface ArtistDB {
  id: string;
  user_id: string;
  stage_name: string;
  genre: string;
  category?: string;
  location?: string;
  image_url?: string | null;
  is_featured?: boolean;
  is_premium?: boolean;
}
// This is what your React components use
export interface ArtistUI {
  id: string;
  userId: string;
  name: string;
  genre: string;
  category?: string;
  location?: string;
  imageUrl?: string;
  isFeatured?: boolean;
  isPremium?: boolean;
}
