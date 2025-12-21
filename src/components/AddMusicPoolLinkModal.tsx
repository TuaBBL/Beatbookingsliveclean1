import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface AddMusicPoolLinkModalProps {
  existingLink?: {
    id: string;
    link_url: string;
    title: string | null;
    description: string | null;
  } | null;
  onClose: () => void;
}

export default function AddMusicPoolLinkModal({ existingLink, onClose }: AddMusicPoolLinkModalProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingLink) {
      setLinkUrl(existingLink.link_url);
      setTitle(existingLink.title || '');
      setDescription(existingLink.description || '');
    }
  }, [existingLink]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!linkUrl.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    if (!linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) {
      setError('URL must start with http:// or https://');
      return;
    }

    try {
      setSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in');
        return;
      }

      const { data: artistProfile } = await supabase
        .from('artist_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const linkData = {
        user_id: user.id,
        artist_id: artistProfile?.id || null,
        link_url: linkUrl.trim(),
        title: title.trim() || null,
        description: description.trim() || null,
      };

      if (existingLink) {
        const { error: updateError } = await supabase
          .from('music_pool_links')
          .update(linkData)
          .eq('id', existingLink.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('music_pool_links')
          .insert([linkData]);

        if (insertError) throw insertError;
      }

      onClose();
    } catch (err: any) {
      console.error('Error saving music pool link:', err);
      if (err.code === '23505') {
        setError('You already have a music pool link. Please update your existing one.');
      } else {
        setError(err.message || 'Failed to save link');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg border border-neutral-800 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <LinkIcon className="w-6 h-6 text-neon-green" />
            <h2 className="text-xl font-bold">
              {existingLink ? 'Update Music Pool Link' : 'Add Music Pool Link'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-600/10 border border-red-600 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Music Pool URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com/my-music-pool"
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-neon-green transition"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the full URL to your music pool page
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Exclusive Music Collection"
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-neon-green transition"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your music pool and what people can find there..."
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-neon-green transition resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/500 characters
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-neon-green to-green-600 hover:from-neon-green/90 hover:to-green-600/90 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-all duration-300 shadow-neon-green hover:shadow-neon-green-lg"
            >
              {submitting ? 'Saving...' : existingLink ? 'Update Link' : 'Add Link'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg font-medium transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
