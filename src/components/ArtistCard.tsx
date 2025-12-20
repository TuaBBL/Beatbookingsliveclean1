import {
  Heart,
  Youtube,
  Instagram,
  Facebook,
  Music,
  Radio,
  Star,
  Crown,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Artist } from '../data/mockArtists';

export interface ArtistCardProps {
  artist: Artist;
  showRank?: boolean;
  onFavouriteChange?: () => void;
}

export function ArtistCard({ artist, showRank = false, onFavouriteChange }: ArtistCardProps) {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const [isCheckingFavourite, setIsCheckingFavourite] = useState(true);

  useEffect(() => {
    checkAuthAndFavourite();
  }, [artist.id]);

  async function checkAuthAndFavourite() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      if (user) {
        const { data } = await supabase
          .from("favourites")
          .select("id")
          .eq("planner_id", user.id)
          .eq("artist_id", artist.id)
          .maybeSingle();

        setIsFavourite(!!data);
      }
    } catch (error) {
      console.error("Error checking favourite:", error);
    } finally {
      setIsCheckingFavourite(false);
    }
  }

  async function toggleFavourite(e: React.MouseEvent) {
    e.stopPropagation();

    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isFavourite) {
        await supabase
          .from("favourites")
          .delete()
          .eq("planner_id", user.id)
          .eq("artist_id", artist.id);
        setIsFavourite(false);
      } else {
        await supabase
          .from("favourites")
          .insert({ planner_id: user.id, artist_id: artist.id });
        setIsFavourite(true);
      }

      if (onFavouriteChange) {
        onFavouriteChange();
      }
    } catch (error) {
      console.error("Error toggling favourite:", error);
    }
  }

  const handleClick = () => {
    navigate(`/planner/artists/${artist.userId || artist.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative bg-black/70 backdrop-blur-sm rounded-xl overflow-hidden border border-neon-green/30 hover:border-neon-green hover:shadow-neon-green-lg transition-all duration-300 hover:-translate-y-2 hover:scale-105 cursor-pointer"
    >
      {showRank && artist.trending && (
        <div className="absolute top-3 left-3 z-10">
          <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center border-2 border-white/20">
            <span className="text-white font-bold text-sm">
              #{artist.trending}
            </span>
          </div>
        </div>
      )}

      <button
        onClick={toggleFavourite}
        disabled={isCheckingFavourite}
        title={!isLoggedIn ? "Log in to save favourites" : isFavourite ? "Remove from favourites" : "Add to favourites"}
        className={`absolute top-3 right-3 z-10 p-2 rounded-full transition-all duration-300 ${
          isLoggedIn
            ? isFavourite
              ? "bg-neon-red text-white shadow-neon-red animate-pulse hover:scale-110"
              : "bg-black/60 text-gray-300 hover:bg-neon-red hover:text-white hover:shadow-neon-red hover:scale-110"
            : "bg-black/40 text-gray-500 cursor-not-allowed"
        }`}
      >
        <Heart className={`w-4 h-4 ${isFavourite ? "fill-current" : ""}`} />
      </button>

      {artist.imageUrl ? (
        <img
          src={artist.imageUrl}
          alt={artist.name}
          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-40 bg-neutral-800 flex items-center justify-center">
          <Music className="w-12 h-12 text-neutral-700" />
        </div>
      )}

      <div className="p-4">
        <h3 className="text-white font-semibold text-lg truncate mb-1">
          {artist.name}
        </h3>

        <p className="text-sm text-gray-400 truncate mb-1">
          {artist.role} · {artist.genre}
        </p>

        <p className="text-xs text-gray-500 truncate mb-3">
          {[artist.city, artist.state, artist.country].filter(Boolean).join(', ')}
        </p>

        <div className="flex gap-2 mb-2">
          {artist.isDemo && (
            <span className="inline-block px-2 py-0.5 bg-neon-red/20 border border-neon-red/60 rounded text-neon-red text-xs font-bold shadow-[0_0_10px_rgba(255,43,43,0.3)]">
              DEMO
            </span>
          )}
          {artist.isPremium && !artist.isDemo && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-neon-green/20 to-neon-green/10 border border-neon-green/60 rounded text-neon-green text-xs font-bold shadow-[0_0_10px_rgba(0,255,136,0.3)]">
              <Crown className="w-3 h-3" />
              PREMIUM
            </span>
          )}
        </div>

        {artist.reviewCount !== undefined && artist.reviewCount > 0 ? (
          <div className="flex items-center gap-1 mb-2 text-sm">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-white font-medium">{artist.averageRating}</span>
            <span className="text-gray-500">({artist.reviewCount})</span>
          </div>
        ) : (
          <div className="mb-2 text-xs text-gray-500">
            No reviews yet
          </div>
        )}

        <div className="flex gap-3 text-gray-400">
          {isLoggedIn ? (
            <>
              {artist.socials?.instagram && (
                <a
                  href={artist.socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-neon-green hover:drop-shadow-[0_0_5px_rgba(0,255,136,0.8)] transition-all duration-300"
                >
                  <Instagram size={16} />
                </a>
              )}
              {artist.socials?.youtube && (
                <a
                  href={artist.socials.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-neon-green hover:drop-shadow-[0_0_5px_rgba(0,255,136,0.8)] transition-all duration-300"
                >
                  <Youtube size={16} />
                </a>
              )}
              {artist.socials?.facebook && (
                <a
                  href={artist.socials.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-neon-green hover:drop-shadow-[0_0_5px_rgba(0,255,136,0.8)] transition-all duration-300"
                >
                  <Facebook size={16} />
                </a>
              )}
              {artist.socials?.spotify && (
                <a
                  href={artist.socials.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-neon-green hover:drop-shadow-[0_0_5px_rgba(0,255,136,0.8)] transition-all duration-300"
                >
                  <Music size={16} />
                </a>
              )}
              {artist.socials?.soundcloud && (
                <a
                  href={artist.socials.soundcloud}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-neon-green hover:drop-shadow-[0_0_5px_rgba(0,255,136,0.8)] transition-all duration-300"
                >
                  <Radio size={16} />
                </a>
              )}
            </>
          ) : (
            <>
              {artist.socials?.instagram && (
                <span
                  title="Sign in to view"
                  className="opacity-40 cursor-not-allowed"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Instagram size={16} />
                </span>
              )}
              {artist.socials?.youtube && (
                <span
                  title="Sign in to view"
                  className="opacity-40 cursor-not-allowed"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Youtube size={16} />
                </span>
              )}
              {artist.socials?.facebook && (
                <span
                  title="Sign in to view"
                  className="opacity-40 cursor-not-allowed"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Facebook size={16} />
                </span>
              )}
              {artist.socials?.spotify && (
                <span
                  title="Sign in to view"
                  className="opacity-40 cursor-not-allowed"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Music size={16} />
                </span>
              )}
              {artist.socials?.soundcloud && (
                <span
                  title="Sign in to view"
                  className="opacity-40 cursor-not-allowed"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Radio size={16} />
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
