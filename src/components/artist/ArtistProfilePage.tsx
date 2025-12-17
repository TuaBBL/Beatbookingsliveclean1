import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Header from '../Header';
import Footer from '../Footer';
import EditArtistProfileModal from './EditArtistProfileModal';
import BookingRequestModal from './BookingRequestModal';
import { MapPin, Music, Star, Award, Edit, Instagram, Youtube, Facebook, Radio } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  image_url: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

interface ArtistProfile {
  id: string;
  user_id: string;
  stage_name: string;
  genre: string;
  category: string;
  location: string;
  type: string;
  is_featured: boolean;
  is_premium: boolean;
}

export default function ArtistProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, image_url, city, state, country')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      if (profileData) {
        const [artistRes, socialRes] = await Promise.all([
          supabase
            .from('artist_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle(),
          supabase
            .from('artist_social_links')
            .select('*')
            .eq('artist_id', userId)
        ]);

        if (artistRes.error) throw artistRes.error;
        setArtistProfile(artistRes.data);

        if (socialRes.data) {
          setSocialLinks(socialRes.data);
        }
      }
    } catch (err) {
      console.error('Error loading artist profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    loadData();
  };

  const isOwner = currentUser?.id === userId;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
            <p className="text-gray-400">This user profile does not exist.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!artistProfile) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Artist Profile Not Found</h1>
            <p className="text-gray-400">This user has not set up their artist profile yet.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const displayName = artistProfile.stage_name || profile.name;
  const location = [profile.city, profile.state, profile.country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden">
            <div className="relative h-48 bg-gradient-to-r from-blue-600 to-blue-800">
              <div className="absolute -bottom-16 left-8">
                <div className="w-32 h-32 rounded-full border-4 border-neutral-900 overflow-hidden bg-neutral-800">
                  {profile.image_url ? (
                    <img
                      src={profile.image_url}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-20 px-8 pb-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{displayName}</h1>
                    {artistProfile.is_featured && (
                      <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-sm font-medium flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        Featured
                      </span>
                    )}
                    {artistProfile.is_premium && (
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm font-medium flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        Premium
                      </span>
                    )}
                  </div>
                  {location && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{location}</span>
                    </div>
                  )}
                </div>
                {isOwner && (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
                  <div className="flex items-center gap-3 mb-4">
                    <Music className="w-6 h-6 text-blue-400" />
                    <h2 className="text-xl font-bold">Artist Details</h2>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400 text-sm">Genre</span>
                      <p className="text-white font-medium">{artistProfile.genre}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Category</span>
                      <p className="text-white font-medium">{artistProfile.category}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Type</span>
                      <p className="text-white font-medium capitalize">{artistProfile.type}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="w-6 h-6 text-blue-400" />
                    <h2 className="text-xl font-bold">Location</h2>
                  </div>
                  <p className="text-white">{artistProfile.location}</p>
                </div>
              </div>

              {socialLinks.length > 0 && (
                <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
                  <h2 className="text-xl font-bold mb-4">Social Links</h2>
                  <div className="flex flex-wrap gap-3">
                    {socialLinks.map((link) => {
                      const getIcon = (platform: string) => {
                        switch (platform) {
                          case 'instagram': return <Instagram className="w-5 h-5" />;
                          case 'youtube': return <Youtube className="w-5 h-5" />;
                          case 'facebook': return <Facebook className="w-5 h-5" />;
                          case 'soundcloud': return <Radio className="w-5 h-5" />;
                          case 'spotify': return <Music className="w-5 h-5" />;
                          default: return <Music className="w-5 h-5" />;
                        }
                      };

                      return (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors"
                        >
                          {getIcon(link.platform)}
                          <span className="capitalize">{link.platform}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {!isOwner && (
                <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
                  <h2 className="text-xl font-bold mb-4">Interested in booking?</h2>
                  <button
                    onClick={() => {
                      if (!currentUser) {
                        navigate('/login');
                        return;
                      }
                      setIsBookingModalOpen(true);
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    {currentUser ? 'Request Booking' : 'Sign In to Book'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {artistProfile && profile && (
        <EditArtistProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          artistProfile={artistProfile}
          profile={profile}
          onSave={handleSave}
        />
      )}

      {artistProfile && (
        <BookingRequestModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          artistId={artistProfile.id}
          artistName={artistProfile.stage_name || profile?.name || 'Artist'}
        />
      )}
    </div>
  );
}
