import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Header from '../Header';
import Footer from '../Footer';
import { Image, Video, Upload, Trash2, ArrowLeft } from 'lucide-react';

interface Media {
  id: string;
  media_type: 'image' | 'video';
  url: string;
  created_at: string;
}

export default function ArtistMedia() {
  const navigate = useNavigate();
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [artistProfileId, setArtistProfileId] = useState<string | null>(null);

  useEffect(() => {
    loadMedia();
  }, []);

  async function loadMedia() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: artistProfile } = await supabase
        .from('artist_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!artistProfile) {
        setLoading(false);
        return;
      }

      setArtistProfileId(artistProfile.id);

      const { data, error } = await supabase
        .from('artist_media')
        .select('*')
        .eq('artist_id', artistProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedia(data || []);
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !artistProfileId) return;

    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setToast(`File too large. Max size: ${isVideo ? '50MB' : '5MB'}`);
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${artistProfileId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('artist_media')
        .insert({
          artist_id: artistProfileId,
          media_type: isVideo ? 'video' : 'image',
          url: data.publicUrl,
        });

      if (insertError) throw insertError;

      setToast('Media uploaded successfully!');
      setTimeout(() => setToast(null), 3000);
      loadMedia();
    } catch (error) {
      console.error('Error uploading media:', error);
      setToast('Failed to upload media');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(mediaId: string, mediaUrl: string) {
    if (!confirm('Are you sure you want to delete this media?')) return;

    try {
      const filePath = mediaUrl.split('/media/')[1];

      if (filePath) {
        await supabase.storage.from('media').remove([filePath]);
      }

      const { error } = await supabase
        .from('artist_media')
        .delete()
        .eq('id', mediaId);

      if (error) throw error;

      setToast('Media deleted successfully');
      setTimeout(() => setToast(null), 3000);
      loadMedia();
    } catch (error) {
      console.error('Error deleting media:', error);
      setToast('Failed to delete media');
      setTimeout(() => setToast(null), 3000);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/artist/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">Media Gallery</h1>
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-white font-medium cursor-pointer">
              <Upload className="w-5 h-5" />
              {uploading ? 'Uploading...' : 'Upload Media'}
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : media.length === 0 ? (
            <div className="bg-neutral-900 border-2 border-neutral-700 rounded-lg p-12 text-center">
              <Image className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No media yet</h3>
              <p className="text-gray-400 mb-6">
                Upload photos and videos to showcase your work
              </p>
              <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-white font-medium cursor-pointer">
                <Upload className="w-5 h-5" />
                Upload Your First Media
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="bg-neutral-900 border-2 border-neutral-700 rounded-lg overflow-hidden hover:border-blue-500 transition group relative"
                >
                  <div className="aspect-video bg-neutral-800 relative">
                    {item.media_type === 'image' ? (
                      <img
                        src={item.url}
                        alt="Artist media"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={item.url}
                        controls
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-xs font-medium flex items-center gap-1">
                      {item.media_type === 'image' ? (
                        <Image className="w-3 h-3" />
                      ) : (
                        <Video className="w-3 h-3" />
                      )}
                      {item.media_type}
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDelete(item.id, item.url)}
                      className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded transition text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-4 right-4 bg-neutral-900 border-2 border-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}

      <Footer />
    </div>
  );
}
