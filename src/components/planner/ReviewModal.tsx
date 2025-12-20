import { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistId: string;
  artistName: string;
  onSuccess: () => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  artistId,
  artistName,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingReview, setExistingReview] = useState<any>(null);

  useEffect(() => {
    if (isOpen && artistId) {
      loadExistingReview();
    }
  }, [isOpen, artistId]);

  async function loadExistingReview() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('artist_reviews')
        .select('*')
        .eq('artist_id', artistId)
        .eq('planner_id', user.id)
        .maybeSingle();

      if (data) {
        setExistingReview(data);
        setRating(data.rating);
        setReviewText(data.review_text || '');
      } else {
        setExistingReview(null);
        setRating(0);
        setReviewText('');
      }
    } catch (err) {
      console.error('Error loading existing review:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to submit a review');
        return;
      }

      if (existingReview) {
        const { error: updateError } = await supabase
          .from('artist_reviews')
          .update({
            rating,
            review_text: reviewText,
          })
          .eq('id', existingReview.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('artist_reviews')
          .insert({
            artist_id: artistId,
            planner_id: user.id,
            rating,
            review_text: reviewText,
          });

        if (insertError) throw insertError;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!existingReview) return;

    if (!confirm('Are you sure you want to delete your review?')) return;

    setLoading(true);
    setError('');

    try {
      const { error: deleteError } = await supabase
        .from('artist_reviews')
        .delete()
        .eq('id', existingReview.id);

      if (deleteError) throw deleteError;

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error deleting review:', err);
      setError(err.message || 'Failed to delete review');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-neutral-900 rounded-lg border border-neutral-800 max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {existingReview ? 'Edit Review' : 'Write a Review'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-gray-400 mb-4">for {artistName}</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Review (optional)
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
              placeholder="Share your experience with this artist..."
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || rating === 0}
              className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed rounded-lg font-semibold transition"
            >
              {loading ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
            </button>
            {existingReview && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed rounded-lg font-semibold transition"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
