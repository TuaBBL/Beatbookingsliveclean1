import { Artist } from '../data/mockArtists';
import { ArtistCard } from './ArtistCard';

interface ArtistGridProps {
  artists: Artist[];
  showRank?: boolean;
  onFavouriteChange?: () => void;
}

export function ArtistGrid({ artists, showRank = false, onFavouriteChange }: ArtistGridProps) {
  if (!Array.isArray(artists)) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {artists.map((artist) => (
        <ArtistCard
          key={artist.id}
          artist={artist}
          showRank={showRank}
          onFavouriteChange={onFavouriteChange}
        />
      ))}
    </div>
  );
}
