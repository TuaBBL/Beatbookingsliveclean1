import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Header from '../Header';
import Footer from '../Footer';
import EditArtistProfileModal from './EditArtistProfileModal';
import BookingRequestModal from './BookingRequestModal';
import { MapPin, Music, Star, Award, Edit, Instagram, Youtube, Facebook, Radio, ArrowLeft, User, ExternalLink } from 'lucide-react';

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
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState<number>(0);
  const [newReviewText, setNewReviewText] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const { data: currentUserProfileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        setCurrentUserRole(currentUserProfileData?.role || null);
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, image_url, city, state, country')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      if (profileData) {
        const artistRes = await supabase
          .from('artist_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (artistRes.error) throw artistRes.error;
        setArtistProfile(artistRes.data);

        if (artistRes.data) {
          const [socialRes, reviewsRes] = await Promise.all([
            supabase
              .from('artist_social_links')
              .select('*')
              .eq('artist_id', artistRes.data.id),
            supabase
              .from('artist_reviews')
              .select(`
                id,
                rating,
                review_text,
                created_at,
                planner_id,
                profiles:planner_id(name, image_url)
              `)
              .eq('artist_id', artistRes.data.id)
              .order('created_at', { ascending: false })
          ]);

          if (socialRes.data) {
            setSocialLinks(socialRes.data);
          }

          if (reviewsRes.data) {
            setReviews(reviewsRes.data);
            const totalRating = reviewsRes.data.reduce((sum: number, r: any) => sum + r.rating, 0);
            setAverageRating(reviewsRes.data.length > 0 ? Math.round((totalRating / reviewsRes.data.length) * 10) / 10 : 0);
            setReviewCount(reviewsRes.data.length);

            if (user) {
              const userReview = reviewsRes.data.find((r: any) => r.planner_id === user.id);
              setHasReviewed(!!userReview);
            }
          }
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

  const handleSubmitReview = async () => {
    if (!currentUser || !artistProfile || newRating === 0) return;

    setSubmittingReview(true);
    try {
      const { error } = await supabase
        .from('artist_reviews')
        .insert({
          artist_id: artistProfile.id,
          planner_id: currentUser.id,
          rating: newRating,
          review_text: newReviewText
        });

      if (error) throw error;

      setShowReviewForm(false);
      setNewRating(0);
      setNewReviewText('');
      loadData();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
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
          {isOwner && (
            <button
              onClick={() => navigate('/artist/dashboard')}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
          )}
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
                          case 'external': return <ExternalLink className="w-5 h-5" />;
                          default: return <Music className="w-5 h-5" />;
                        }
                      };

                      const getDisplayName = (platform: string) => {
                        return platform === 'external' ? 'External Link' : platform;
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
                          <span className="capitalize">{getDisplayName(link.platform)}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Reviews</h2>
                  {reviewCount > 0 && (
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-xl font-bold">{averageRating}</span>
                      <span className="text-gray-400">({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
                    </div>
                  )}
                </div>

                {!isOwner && currentUserRole === 'planner' && !hasReviewed && (
                  <div className="mb-6">
                    {showReviewForm ? (
                      <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-700">
                        <h3 className="text-lg font-semibold mb-3">Write a Review</h3>
                        <div className="mb-4">
                          <label className="block text-sm text-gray-400 mb-2">Rating</label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setNewRating(star)}
                                className="transition"
                              >
                                <Star
                                  className={`w-8 h-8 ${
                                    star <= newRating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-600'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm text-gray-400 mb-2">Review (optional)</label>
                          <textarea
                            value={newReviewText}
                            onChange={(e) => setNewReviewText(e.target.value)}
                            placeholder="Share your experience..."
                            className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                            rows={4}
                            maxLength={500}
                          />
                          <p className="text-xs text-gray-500 mt-1">{newReviewText.length}/500</p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={handleSubmitReview}
                            disabled={submittingReview || newRating === 0}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                          >
                            {submittingReview ? 'Submitting...' : 'Submit Review'}
                          </button>
                          <button
                            onClick={() => {
                              setShowReviewForm(false);
                              setNewRating(0);
                              setNewReviewText('');
                            }}
                            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        Write a Review
                      </button>
                    )}
                  </div>
                )}

                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review: any) => (
                      <div key={review.id} className="bg-neutral-900 rounded-lg p-4 border border-neutral-700">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden">
                              {review.profiles?.image_url ? (
                                <img
                                  src={review.profiles.image_url}
                                  alt={review.profiles?.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-5 h-5 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{review.profiles?.name || 'Anonymous'}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(review.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        {review.review_text && (
                          <p className="text-gray-300 text-sm">{review.review_text}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
                )}
              </div>

              {!isOwner && currentUserRole === 'planner' && (
                <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
                  <h2 className="text-xl font-bold mb-4">Interested in booking?</h2>
                  <button
                    onClick={() => setIsBookingModalOpen(true)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Request Booking
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
