import { ArtistDB } from '../types/artist';
import { Artist } from '../data/mockArtists';

export function normalizeArtistFromDB(dbArtist: any): Omit<Artist, 'socials' | 'city' | 'state' | 'country'> {
  const imageUrl = dbArtist.image_url || dbArtist.profiles?.image_url || undefined;

  return {
    id: dbArtist.id,
    userId: dbArtist.user_id,
    name: dbArtist.stage_name || 'Unknown Artist',
    role: dbArtist.category || 'DJ',
    genre: dbArtist.genre || 'Electronic',
    imageUrl,
    bio: dbArtist.bio,
    isDemo: dbArtist.type === 'demo',
    isPremium: false,
  };
}
