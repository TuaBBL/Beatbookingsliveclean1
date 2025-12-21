import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Upload, Trash2, Image as ImageIcon, Video as VideoIcon, UserCircle } from 'lucide-react';

interface EditArtistProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistProfile: any;
  profile: any;
  onSave: () => void;
}

export default function EditArtistProfileModal({
  isOpen,
  onClose,
  artistProfile,
  profile,
  onSave,
}: EditArtistProfileModalProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    stage_name: artistProfile?.stage_name || '',
    email: profile?.email || '',
    phone_country_code: profile?.phone_country_code || '+61',
    phone_number: profile?.phone_number || '',
    city: profile?.city || '',
    state: profile?.state || '',
    country: profile?.country || 'AU',
    bio: artistProfile?.bio || '',
    genre: artistProfile?.genre || '',
    category: artistProfile?.category || '',
    type: artistProfile?.type || 'real',
    equipment: artistProfile?.equipment || '',
    price_tier_1: artistProfile?.price_tier_1 || '',
    price_tier_1_description: artistProfile?.price_tier_1_description || '',
    price_tier_2: artistProfile?.price_tier_2 || '',
    price_tier_2_description: artistProfile?.price_tier_2_description || '',
  });

  useEffect(() => {
    if (isOpen && artistProfile) {
      loadMediaAndSocial();
      loadSubscription();
    }
  }, [isOpen, artistProfile]);

  const loadMediaAndSocial = async () => {
    if (!artistProfile?.id) return;

    const [mediaRes, socialRes] = await Promise.all([
      supabase
        .from('artist_media')
        .select('*')
        .eq('artist_id', artistProfile.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('artist_social_links')
        .select('*')
        .eq('artist_id', artistProfile.id),
    ]);

    if (mediaRes.data) setMediaList(mediaRes.data);
    if (socialRes.data) setSocialLinks(socialRes.data);
  };

  const loadSubscription = async () => {
    if (!artistProfile?.id) return;

    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('artist_id', artistProfile.id)
      .maybeSingle();

    setSubscription(data);
  };

  const getMediaLimits = () => {
    const tier = subscription?.entitlement_tier || 'free';
    if (tier === 'premium' || tier === 'free_forever') {
      return { images: 20, videos: 10 };
    }
    return { images: 10, videos: 5 };
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const profileUpdates: any = {
        name: formData.name,
        phone_country_code: formData.phone_country_code,
        phone_number: formData.phone_number,
        city: formData.city,
        state: formData.state,
        country: formData.country,
      };

      await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      const location = [formData.city, formData.state, formData.country]
        .filter(Boolean)
        .join(', ') || 'Unknown';

      if (artistProfile?.id) {
        await supabase
          .from('artist_profiles')
          .update({
            stage_name: formData.stage_name,
            bio: formData.bio,
            genre: formData.genre,
            category: formData.category,
            type: formData.type,
            location: location,
            equipment: formData.equipment,
            price_tier_1: formData.price_tier_1 ? parseFloat(formData.price_tier_1) : null,
            price_tier_1_description: formData.price_tier_1_description,
            price_tier_2: formData.price_tier_2 ? parseFloat(formData.price_tier_2) : null,
            price_tier_2_description: formData.price_tier_2_description,
          })
          .eq('id', artistProfile.id);
      } else {
        await supabase
          .from('artist_profiles')
          .insert({
            user_id: user.id,
            stage_name: formData.stage_name,
            bio: formData.bio,
            genre: formData.genre,
            category: formData.category,
            type: formData.type,
            location: location,
            equipment: formData.equipment,
            price_tier_1: formData.price_tier_1 ? parseFloat(formData.price_tier_1) : null,
            price_tier_1_description: formData.price_tier_1_description,
            price_tier_2: formData.price_tier_2 ? parseFloat(formData.price_tier_2) : null,
            price_tier_2_description: formData.price_tier_2_description,
          });
      }

      onSave();
      onClose();
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please select a valid image file (JPG, PNG, or WEBP)');
      e.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size must be less than 10MB');
      e.target.value = '';
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated. Please log in again.');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `profiles/${user.id}-${Date.now()}.${fileExt}`;

      console.log('Uploading profile image to:', fileName);

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('media')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Upload successful:', uploadData);

      const { data } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      console.log('Public URL:', data.publicUrl);

      const { error: updateError, data: updateData } = await supabase
        .from('profiles')
        .update({ image_url: data.publicUrl })
        .eq('id', user.id)
        .select();

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      console.log('Profile updated successfully:', updateData);

      if (artistProfile?.id) {
        const { error: artistUpdateError, data: artistUpdateData } = await supabase
          .from('artist_profiles')
          .update({ image_url: data.publicUrl })
          .eq('id', artistProfile.id)
          .select();

        if (artistUpdateError) {
          console.error('Artist profile update error:', artistUpdateError);
          throw new Error(`Failed to update artist profile: ${artistUpdateError.message}`);
        }

        console.log('Artist profile image_url updated successfully:', artistUpdateData);
      }

      e.target.value = '';
      onSave();
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setUploadError(err.message || 'Failed to upload image. Please try again.');
      e.target.value = '';
    } finally {
      setUploading(false);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file || !artistProfile?.id) return;

    const limits = getMediaLimits();
    const currentCount = mediaList.filter(m => m.media_type === type).length;
    const limit = type === 'image' ? limits.images : limits.videos;

    if (currentCount >= limit) {
      setUploadError(`${type === 'image' ? 'Image' : 'Video'} limit reached: ${limit} maximum`);
      e.target.value = '';
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const expectedType = type === 'image' ? 'image/' : 'video/';
      if (!file.type.startsWith(expectedType)) {
        throw new Error(`Please select a valid ${type} file`);
      }

      const maxSize = type === 'image' ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(`${type === 'image' ? 'Image' : 'Video'} size must be less than ${type === 'image' ? '10MB' : '100MB'}`);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `artist-media/${artistProfile.id}-${Date.now()}.${fileExt}`;

      console.log(`Uploading ${type} to:`, fileName);

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('media')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Upload successful:', uploadData);

      const { data } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      console.log('Public URL:', data.publicUrl);

      const { error: insertError, data: insertData } = await supabase
        .from('artist_media')
        .insert({
          artist_id: artistProfile.id,
          media_type: type,
          url: data.publicUrl,
        })
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(`Failed to save media: ${insertError.message}`);
      }

      console.log('Media record created:', insertData);

      e.target.value = '';
      loadMediaAndSocial();
    } catch (err: any) {
      console.error('Error uploading media:', err);
      setUploadError(err.message || 'Failed to upload media. Please try again.');
      e.target.value = '';
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Delete this media?')) return;

    try {
      await supabase
        .from('artist_media')
        .delete()
        .eq('id', mediaId);

      loadMediaAndSocial();
    } catch (err) {
      console.error('Error deleting media:', err);
    }
  };

  const handleSetAsProfileImage = async (imageUrl: string) => {
    if (!confirm('Set this image as your profile picture?')) return;

    setUploading(true);
    setUploadError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated. Please log in again.');
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ image_url: imageUrl })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }

      if (artistProfile?.id) {
        const { error: artistError } = await supabase
          .from('artist_profiles')
          .update({ image_url: imageUrl })
          .eq('id', artistProfile.id);

        if (artistError) {
          console.error('Artist profile update error:', artistError);
          throw new Error(`Failed to update artist profile: ${artistError.message}`);
        }
      }

      onSave();
    } catch (err: any) {
      console.error('Error setting profile image:', err);
      setUploadError(err.message || 'Failed to set profile image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSocialLinkUpdate = async (platform: string, url: string) => {
    if (!artistProfile?.id) return;

    try {
      const existing = socialLinks.find(s => s.platform === platform);

      if (url.trim() === '') {
        if (existing) {
          await supabase
            .from('artist_social_links')
            .delete()
            .eq('id', existing.id);
        }
      } else {
        if (existing) {
          await supabase
            .from('artist_social_links')
            .update({ url })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('artist_social_links')
            .insert({
              artist_id: artistProfile.id,
              platform,
              url,
            });
        }
      }

      loadMediaAndSocial();
    } catch (err) {
      console.error('Error updating social link:', err);
    }
  };

  const limits = getMediaLimits();
  const imageCount = mediaList.filter(m => m.media_type === 'image').length;
  const videoCount = mediaList.filter(m => m.media_type === 'video').length;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg border border-neutral-800 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-xl font-bold text-white">Edit Artist Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex border-b border-neutral-800">
          <button
            onClick={() => {
              setActiveTab('basic');
              setUploadError(null);
            }}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'basic'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Basic Info
          </button>
          <button
            onClick={() => {
              setActiveTab('media');
              setUploadError(null);
            }}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'media'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Media
          </button>
          <button
            onClick={() => {
              setActiveTab('social');
              setUploadError(null);
            }}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'social'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Social Links
          </button>
        </div>

        {activeTab === 'basic' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {uploadError && (
              <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg">
                {uploadError}
              </div>
            )}
            {uploading && (
              <div className="bg-blue-900/30 border border-blue-800 text-blue-400 px-4 py-3 rounded-lg">
                Uploading image...
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stage Name
                </label>
                <input
                  type="text"
                  value={formData.stage_name}
                  onChange={(e) =>
                    setFormData({ ...formData, stage_name: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email (read-only)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-gray-400 cursor-not-allowed"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.phone_country_code}
                    onChange={(e) =>
                      setFormData({ ...formData, phone_country_code: e.target.value })
                    }
                    className="w-32 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="+61">+61 (AU)</option>
                    <option value="+64">+64 (NZ)</option>
                    <option value="+1">+1 (US/CA)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+49">+49 (DE)</option>
                    <option value="+33">+33 (FR)</option>
                    <option value="+81">+81 (JP)</option>
                    <option value="+82">+82 (KR)</option>
                    <option value="+86">+86 (CN)</option>
                    <option value="+91">+91 (IN)</option>
                  </select>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) =>
                      setFormData({ ...formData, phone_number: e.target.value })
                    }
                    placeholder="123 456 789"
                    className="flex-1 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Country
                </label>
                <select
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="AU">Australia</option>
                  <option value="NZ">New Zealand</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Genre
                </label>
                <input
                  type="text"
                  value={formData.genre}
                  onChange={(e) =>
                    setFormData({ ...formData, genre: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select category...</option>
                  <option value="DJ">DJ</option>
                  <option value="Live Music">Live Music</option>
                  <option value="Band">Band</option>
                  <option value="Producer">Producer</option>
                  <option value="Vocalist">Vocalist</option>
                  <option value="Instrumentalist">Instrumentalist</option>
                  <option value="Electronic">Electronic</option>
                  <option value="Hip Hop">Hip Hop</option>
                  <option value="Rock">Rock</option>
                  <option value="Jazz">Jazz</option>
                  <option value="Classical">Classical</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="real">Real</option>
                  <option value="demo">Demo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Tell planners about yourself..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Equipment
              </label>
              <textarea
                value={formData.equipment}
                onChange={(e) =>
                  setFormData({ ...formData, equipment: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                placeholder="List your equipment (e.g., Pioneer DDJ-1000, Shure SM58, etc.)"
              />
            </div>

            <div className="space-y-4 border-t border-neutral-700 pt-4">
              <h3 className="text-lg font-semibold text-white">Pricing</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price Option 1 ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price_tier_1}
                    onChange={(e) =>
                      setFormData({ ...formData, price_tier_1: e.target.value })
                    }
                    placeholder="500"
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price Option 2 ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price_tier_2}
                    onChange={(e) =>
                      setFormData({ ...formData, price_tier_2: e.target.value })
                    }
                    placeholder="1000"
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description for Option 1
                  </label>
                  <textarea
                    value={formData.price_tier_1_description}
                    onChange={(e) =>
                      setFormData({ ...formData, price_tier_1_description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="E.g., 2-hour set, basic setup..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description for Option 2
                  </label>
                  <textarea
                    value={formData.price_tier_2_description}
                    onChange={(e) =>
                      setFormData({ ...formData, price_tier_2_description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="E.g., 4-hour set, full production..."
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Profile Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageUpload}
                disabled={uploading}
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50"
              />
              <p className="text-xs text-gray-400 mt-1">Used for artist cards and profile (max 10MB)</p>
              {uploading && (
                <p className="text-xs text-blue-400 mt-2">Uploading image...</p>
              )}
              {uploadError && (
                <p className="text-xs text-red-400 mt-2">{uploadError}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'media' && (
          <div className="p-6 space-y-6">
            {uploadError && (
              <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg">
                {uploadError}
              </div>
            )}
            {uploading && (
              <div className="bg-blue-900/30 border border-blue-800 text-blue-400 px-4 py-3 rounded-lg">
                Uploading...
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Images ({imageCount}/{limits.images})</h3>
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleMediaUpload(e, 'image')}
                    disabled={uploading || imageCount >= limits.images}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {mediaList
                  .filter(m => m.media_type === 'image')
                  .map(media => (
                    <div key={media.id} className="relative group">
                      <img
                        src={media.url}
                        alt="Artist media"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleSetAsProfileImage(media.url)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                          title="Set as profile image"
                        >
                          <UserCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMedia(media.id)}
                          className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                          title="Delete image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Videos ({videoCount}/{limits.videos})</h3>
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Upload Video</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleMediaUpload(e, 'video')}
                    disabled={uploading || videoCount >= limits.videos}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {mediaList
                  .filter(m => m.media_type === 'video')
                  .map(media => (
                    <div key={media.id} className="relative group">
                      <video
                        src={media.url}
                        controls
                        className="w-full h-48 rounded-lg bg-black"
                      />
                      <button
                        onClick={() => handleDeleteMedia(media.id)}
                        className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {uploading && (
              <div className="text-center text-blue-400">Uploading...</div>
            )}
          </div>
        )}

        {activeTab === 'social' && (
          <div className="p-6 space-y-4">
            {['instagram', 'youtube', 'facebook', 'soundcloud', 'spotify', 'mixcloud', 'patreon', 'external'].map(platform => {
              const link = socialLinks.find(s => s.platform === platform);
              const displayName = platform === 'external' ? 'External Link' : platform;
              return (
                <div key={platform}>
                  <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                    {displayName}
                  </label>
                  <input
                    type="url"
                    defaultValue={link?.url || ''}
                    onBlur={(e) => handleSocialLinkUpdate(platform, e.target.value)}
                    placeholder={platform === 'external' ? 'https://...' : `https://${platform}.com/...`}
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
