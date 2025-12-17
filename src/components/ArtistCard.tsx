import {
  Heart,
  Youtube,
  Instagram,
  Facebook,
  Music,
  Radio,
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
    navigate(`/planner/artists/${artist.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer shadow-lg"
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
        className={`absolute top-3 right-3 z-10 p-2 rounded-full transition ${
          isLoggedIn
            ? isFavourite
              ? "bg-pink-600 text-white hover:bg-pink-700"
              : "bg-black/60 text-gray-300 hover:bg-pink-600 hover:text-white"
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
          {artist.state}, {artist.country}
        </p>

        {artist.isDemo && (
          <div className="mb-2">
            <span className="inline-block px-2 py-0.5 bg-orange-500/20 border border-orange-500/40 rounded text-orange-500 text-xs font-bold">
              DEMO
            </span>
          </div>
        )}

        <div className="flex gap-3 text-gray-400">
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
