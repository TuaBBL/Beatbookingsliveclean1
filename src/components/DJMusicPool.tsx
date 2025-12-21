import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Header from './Header';
import Footer from './Footer';
import SoundBarsBackground from './SoundBarsBackground';
import AddMusicPoolLinkModal from './AddMusicPoolLinkModal';
import { Music, ExternalLink, Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';

interface MusicPoolLink {
  id: string;
  user_id: string;
  artist_id: string | null;
  link_url: string;
  title: string | null;
  description: string | null;
  created_at: string;
  profiles: {
    name: string;
    image_url: string | null;
  } | null;
  artist_profiles: {
    stage_name: string;
    image_url: string | null;
    genre: string | null;
    category: string | null;
  } | null;
}

export default function DJMusicPool() {
  const navigate = useNavigate();
  const [links, setLinks] = useState<MusicPoolLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userLink, setUserLink] = useState<MusicPoolLink | null>(null);
  const [editingLink, setEditingLink] = useState<MusicPoolLink | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasArtistProfile, setHasArtistProfile] = useState<boolean>(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadLinks();
    }
  }, [currentUser]);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setCurrentUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserRole(profile.role);
      }

      const { data: artistProfile } = await supabase
        .from('artist_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      setHasArtistProfile(!!artistProfile);
    } catch (error) {
      console.error('Error checking auth:', error);
      navigate('/login');
    }
  };

  const loadLinks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('music_pool_links')
        .select(`
          *,
          profiles!music_pool_links_user_id_fkey(name, image_url),
          artist_profiles(stage_name, image_url, genre, category)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLinks(data || []);
      const userOwnLink = data?.find((link) => link.user_id === currentUser.id);
      setUserLink(userOwnLink || null);
    } catch (err) {
      console.error('Error loading music pool links:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this music pool link?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('music_pool_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      loadLinks();
    } catch (err) {
      console.error('Error deleting link:', err);
      alert('Failed to delete link');
    }
  };

  const handleEdit = (link: MusicPoolLink) => {
    setEditingLink(link);
    setShowAddModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setEditingLink(null);
    loadLinks();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <SoundBarsBackground />

      <main className="relative z-10 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => {
              if (hasArtistProfile) {
                navigate('/artist/dashboard');
              } else {
                navigate('/planner/dashboard');
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-gray-300 hover:text-white bg-neutral-800/50 hover:bg-neutral-800 rounded-lg transition-all duration-300 border border-neutral-700 hover:border-neutral-600"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Music className="w-12 h-12 text-neon-green" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-neon-green to-blue-500 bg-clip-text text-transparent">
                DJ Music Pool
              </h1>
            </div>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-6">
              Share and discover DJ music pools from artists around the world. Connect with the music community and access exclusive content.
            </p>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-green to-green-600 hover:from-neon-green/90 hover:to-green-600/90 rounded-lg font-semibold transition-all duration-300 shadow-neon-green hover:shadow-neon-green-lg"
            >
              <Plus className="w-5 h-5" />
              {userLink ? 'Update My Link' : 'Add My Link'}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading music pool links...</p>
            </div>
          ) : links.length === 0 ? (
            <div className="text-center py-12">
              <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No music pool links yet</p>
              <p className="text-gray-500">Be the first to share your music pool!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {links.map((link) => (
                <MusicPoolCard
                  key={link.id}
                  link={link}
                  isOwner={link.user_id === currentUser?.id}
                  onEdit={() => handleEdit(link)}
                  onDelete={() => handleDelete(link.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {showAddModal && (
        <AddMusicPoolLinkModal
          existingLink={editingLink}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

interface MusicPoolCardProps {
  link: MusicPoolLink;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function MusicPoolCard({ link, isOwner, onEdit, onDelete }: MusicPoolCardProps) {
  const artistProfile = link.artist_profiles;
  const userProfile = link.profiles;

  const displayName = artistProfile?.stage_name || userProfile?.name || 'Unknown';
  const imageUrl = artistProfile?.image_url || userProfile?.image_url;
  const category = artistProfile?.category;
  const genre = artistProfile?.genre;

  return (
    <div className="bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden hover:border-neon-green transition-all duration-300 group">
      <div className="flex items-start gap-4 p-4">
        <div className="flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={displayName}
              className="w-20 h-20 rounded-lg object-cover border-2 border-neutral-700 group-hover:border-neon-green transition-colors"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-neutral-800 border-2 border-neutral-700 group-hover:border-neon-green flex items-center justify-center transition-colors">
              <Music className="w-8 h-8 text-gray-600" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg mb-1 truncate">{displayName}</h3>
          {(category || genre) && (
            <div className="flex flex-wrap gap-2 mb-2">
              {category && (
                <span className="text-xs px-2 py-1 bg-blue-600/20 text-blue-400 rounded">
                  {category}
                </span>
              )}
              {genre && (
                <span className="text-xs px-2 py-1 bg-purple-600/20 text-purple-400 rounded">
                  {genre}
                </span>
              )}
            </div>
          )}

          {link.title && (
            <p className="text-sm text-gray-300 mb-1 font-medium">{link.title}</p>
          )}

          {link.description && (
            <p className="text-xs text-gray-500 mb-3 line-clamp-2">{link.description}</p>
          )}

          <div className="flex items-center gap-2">
            <a
              href={link.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-neon-green/10 text-neon-green border border-neon-green hover:bg-neon-green/20 rounded transition-colors text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Visit Pool
            </a>

            {isOwner && (
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={onEdit}
                  className="p-1.5 text-blue-400 hover:bg-blue-600/20 rounded transition"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1.5 text-red-400 hover:bg-red-600/20 rounded transition"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
