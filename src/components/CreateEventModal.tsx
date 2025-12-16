import { useState, useEffect } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Event {
  id: string;
  title: string;
  type: string;
  country: string;
  state: string;
  city: string;
  venue: string | null;
  event_date: string;
  event_end_date: string | null;
  start_time: string;
  end_time: string;
  cost: number | null;
  ticket_link: string | null;
  cover_image: string | null;
  description: string | null;
  external_link: string | null;
  status: string;
}

interface Profile {
  id: string;
  role: string;
  country: string | null;
  state: string | null;
  city: string | null;
}

interface CreateEventModalProps {
  event: Event | null;
  profile: Profile;
  onClose: () => void;
  onSuccess: () => void;
}

interface MediaFile {
  id?: string;
  file?: File;
  url?: string;
  type: 'image' | 'video';
  preview?: string;
}

const AUSTRALIAN_STATES = [
  'NSW',
  'VIC',
  'QLD',
  'SA',
  'WA',
  'TAS',
  'NT',
  'ACT'
];

const NZ_REGIONS = [
  'Northland',
  'Auckland',
  'Waikato',
  'Bay of Plenty',
  'Gisborne',
  'Hawke\'s Bay',
  'Taranaki',
  'Manawatu-Whanganui',
  'Wellington',
  'Tasman',
  'Nelson',
  'Marlborough',
  'West Coast',
  'Canterbury',
  'Otago',
  'Southland'
];

const GENRES = [
  'Rock',
  'Pop',
  'Jazz',
  'Blues',
  'Electronic',
  'Hip Hop',
  'R&B',
  'Country',
  'Classical',
  'Metal',
  'Indie',
  'Folk',
  'Reggae',
  'Latin',
  'Soul',
  'Funk',
  'Punk',
  'Alternative',
  'Dance',
  'House',
  'Techno',
  'Other'
];

export default function CreateEventModal({ event, profile, onClose, onSuccess }: CreateEventModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    country: profile.country || 'AU',
    state: profile.state || '',
    city: profile.city || '',
    venue: '',
    event_date: '',
    event_end_date: '',
    start_time: '',
    end_time: '',
    cost: '',
    ticket_link: '',
    cover_image: '',
    description: '',
    external_link: '',
    status: 'draft'
  });
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [existingMedia, setExistingMedia] = useState<MediaFile[]>([]);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        type: event.type,
        country: event.country,
        state: event.state,
        city: event.city,
        venue: event.venue || '',
        event_date: event.event_date,
        event_end_date: event.event_end_date || '',
        start_time: event.start_time,
        end_time: event.end_time,
        cost: event.cost?.toString() || '',
        ticket_link: event.ticket_link || '',
        cover_image: event.cover_image || '',
        description: event.description || '',
        external_link: event.external_link || '',
        status: event.status
      });
      setCoverImageFile(null);
      setCoverImagePreview('');
      loadExistingMedia(event.id);
    }
  }, [event]);

  async function loadExistingMedia(eventId: string) {
    try {
      const { data, error } = await supabase
        .from('event_media')
        .select('*')
        .eq('event_id', eventId);

      if (error) throw error;

      if (data) {
        setExistingMedia(data.map(item => ({
          id: item.id,
          url: item.url,
          type: item.media_type as 'image' | 'video'
        })));
      }
    } catch (error) {
      console.error('Error loading media:', error);
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const newMediaFiles = files.map(file => {
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      return {
        file,
        type,
        preview: URL.createObjectURL(file)
      } as MediaFile;
    });

    setMediaFiles([...mediaFiles, ...newMediaFiles]);
  };

  const removeMediaFile = (index: number) => {
    const newFiles = [...mediaFiles];
    if (newFiles[index].preview) {
      URL.revokeObjectURL(newFiles[index].preview!);
    }
    newFiles.splice(index, 1);
    setMediaFiles(newFiles);
  };

  const removeExistingMedia = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return;

    try {
      const { error } = await supabase
        .from('event_media')
        .delete()
        .eq('id', mediaId);

      if (error) throw error;

      setExistingMedia(existingMedia.filter(m => m.id !== mediaId));
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Failed to delete media');
    }
  };

  const handleCoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setFormData({ ...formData, cover_image: '' });
    }
  };

  const removeCoverImage = () => {
    setCoverImageFile(null);
    setCoverImagePreview('');
    setFormData({ ...formData, cover_image: '' });
  };

  const uploadCoverImage = async (): Promise<string | null> => {
    if (!coverImageFile) return null;

    const fileExt = coverImageFile.name.split('.').pop();
    const fileName = `cover-${Date.now()}.${fileExt}`;
    const filePath = `event-covers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, coverImageFile);

    if (uploadError) {
      console.error('Cover image upload error:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const uploadMediaFiles = async (eventId: string) => {
    for (const media of mediaFiles) {
      if (media.file) {
        const fileExt = media.file.name.split('.').pop();
        const fileName = `${eventId}-${Date.now()}.${fileExt}`;
        const filePath = `event-media/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, media.file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        await supabase
          .from('event_media')
          .insert([{
            event_id: eventId,
            media_type: media.type,
            url: publicUrl
          }]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let coverImageUrl = formData.cover_image;

      if (coverImageFile) {
        const uploadedUrl = await uploadCoverImage();
        if (uploadedUrl) {
          coverImageUrl = uploadedUrl;
        }
      }

      const eventData = {
        creator_id: profile.id,
        creator_role: profile.role,
        title: formData.title,
        type: formData.type,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        venue: formData.venue || null,
        event_date: formData.event_date,
        event_end_date: formData.event_end_date || null,
        start_time: formData.start_time,
        end_time: formData.end_time,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        ticket_link: formData.ticket_link || null,
        cover_image: coverImageUrl || null,
        description: formData.description || null,
        external_link: formData.external_link || null,
        status: formData.status
      };

      let eventId: string;

      if (event) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', event.id);

        if (error) throw error;
        eventId = event.id;
      } else {
        const { data, error } = await supabase
          .from('events')
          .insert([eventData])
          .select()
          .single();

        if (error) throw error;
        eventId = data.id;
      }

      if (mediaFiles.length > 0) {
        await uploadMediaFiles(eventId);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const states = formData.country === 'NZ' ? NZ_REGIONS : AUSTRALIAN_STATES;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-charcoal rounded-xl max-w-4xl w-full border border-gray-800 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-800 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">
            {event ? 'Edit Event' : 'Create Event'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form id="event-form" onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green transition"
              placeholder="e.g., Live Jazz Night"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Genre *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-neon-green transition"
              >
                <option value="">Select Genre</option>
                {GENRES.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                State *
              </label>
              <select
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-neon-green transition"
              >
                <option value="">Select State</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                City *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green transition"
                placeholder="e.g., Sydney"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Venue (optional)
            </label>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green transition"
              placeholder="e.g., The Opera House"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-neon-green transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date (for multi-day events)
              </label>
              <input
                type="date"
                value={formData.event_end_date}
                onChange={(e) => setFormData({ ...formData, event_end_date: e.target.value })}
                min={formData.event_date}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-neon-green transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-neon-green transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Time *
              </label>
              <input
                type="time"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-neon-green transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ticket Cost (optional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green transition"
                placeholder="e.g., 25.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ticket Link (optional)
              </label>
              <input
                type="url"
                value={formData.ticket_link}
                onChange={(e) => setFormData({ ...formData, ticket_link: e.target.value })}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green transition"
                placeholder="https://tickets.example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cover Image (optional)
            </label>

            {(coverImagePreview || formData.cover_image) && (
              <div className="mb-3 relative inline-block">
                <img
                  src={coverImagePreview || formData.cover_image}
                  alt="Cover preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeCoverImage}
                  className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageSelect}
                  className="hidden"
                  id="cover-image-upload"
                />
                <label
                  htmlFor="cover-image-upload"
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-center cursor-pointer hover:bg-gray-700 hover:border-neon-green transition"
                >
                  <Upload className="w-5 h-5 inline-block mr-2" />
                  Upload from Device
                </label>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-900 text-gray-500">or</span>
                </div>
              </div>

              <input
                type="url"
                value={formData.cover_image}
                onChange={(e) => {
                  setFormData({ ...formData, cover_image: e.target.value });
                  setCoverImageFile(null);
                  setCoverImagePreview('');
                }}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green transition"
                placeholder="Enter image URL"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload Images & Videos (optional)
            </label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-neon-green transition">
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="media-upload"
              />
              <label htmlFor="media-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400">Click to upload images or videos</p>
                <p className="text-sm text-gray-600 mt-1">Supports JPG, PNG, MP4, MOV</p>
              </label>
            </div>

            {existingMedia.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Existing Media:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingMedia.map((media) => (
                    <div key={media.id} className="relative group">
                      {media.type === 'image' ? (
                        <img
                          src={media.url}
                          alt="Event media"
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <video
                          src={media.url}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeExistingMedia(media.id!)}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mediaFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">New Media to Upload:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {mediaFiles.map((media, index) => (
                    <div key={index} className="relative group">
                      {media.type === 'image' ? (
                        <img
                          src={media.preview}
                          alt="Preview"
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <video
                          src={media.preview}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeMediaFile(index)}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green transition resize-none"
              placeholder="Tell people about your event..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              External Link (optional)
            </label>
            <input
              type="url"
              value={formData.external_link}
              onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green transition"
              placeholder="https://example.com/event"
            />
          </div>
        </form>

        <div className="flex gap-4 p-6 border-t border-gray-800 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="event-form"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-neon-green text-black rounded-lg font-bold hover:bg-neon-green/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(57,255,20,0.5)] hover:shadow-[0_0_35px_rgba(57,255,20,0.7)]"
          >
            {loading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  );
}
