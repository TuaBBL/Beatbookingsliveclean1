import {
  Heart,
  Youtube,
  Instagram,
  Facebook,
  Music,
  Radio,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Artist } from '../data/mockArtists';

export interface ArtistCardProps {
  artist: Artist;
  showRank?: boolean;
}

export function ArtistCard({ artist, showRank = false }: ArtistCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/planner/artists/${artist.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative bg-charcoal rounded-xl overflow-hidden border border-gray-800 hover:border-neon-green/50 transition-all duration-300 hover:-translate-y-2 glow-card cursor-pointer"
    >

      {showRank && artist.trending && (
        <div className="absolute top-3 left-3 z-10">
          <div className="w-10 h-10 rounded-full bg-neon-red/90 flex items-center justify-center border-2 border-white/20 glow-border-red">
            <span className="text-white font-bold text-sm">
              #{artist.trending}
            </span>
          </div>
        </div>
      )}

      <img
        src={artist.imageUrl}
        alt={artist.name}
        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
      />

      <div className="p-4">
        <h3 className="text-white font-semibold text-lg truncate">
          {artist.name}
        </h3>

        <p className="text-gray-400 text-sm truncate">
          {artist.genre}
        </p>

        <div className="flex gap-3 mt-3 text-gray-400">
          {artist.socials?.instagram && <Instagram size={16} />}
          {artist.socials?.youtube && <Youtube size={16} />}
          {artist.socials?.facebook && <Facebook size={16} />}
          {artist.socials?.spotify && <Music size={16} />}
          {artist.socials?.soundcloud && <Radio size={16} />}
        </div>
      </div>
    </div>
  );
}
