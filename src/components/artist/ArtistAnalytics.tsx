import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Eye, Calendar, Star, TrendingUp, Award, BarChart3 } from 'lucide-react';

interface AnalyticsData {
  total_views: number;
  unique_viewers: number;
  total_booking_requests: number;
  accepted_bookings: number;
  pending_bookings: number;
  total_reviews: number;
  average_rating: number;
  views_by_day: Array<{ date: string; views: number }>;
}

interface ArtistAnalyticsProps {
  artistId: string;
}

export default function ArtistAnalytics({ artistId }: ArtistAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    loadAnalytics();
  }, [artistId, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_artist_analytics', {
        p_artist_id: artistId,
        p_days: timeRange,
      });

      if (error) throw error;
      setAnalytics(data);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-8">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
            PREMIUM
          </span>
        </div>
        <p className="text-gray-400">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-8">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
            PREMIUM
          </span>
        </div>
        <p className="text-gray-400">No analytics data available</p>
      </div>
    );
  }

  const maxViews = Math.max(...(analytics.views_by_day?.map((d) => d.views) || [1]));

  return (
    <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
            PREMIUM
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange(7)}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              timeRange === 7
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-800 text-gray-400 hover:text-white'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange(30)}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              timeRange === 30
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-800 text-gray-400 hover:text-white'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeRange(90)}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              timeRange === 90
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-800 text-gray-400 hover:text-white'
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Eye className="w-5 h-5" />}
          title="Total Views"
          value={analytics.total_views}
          subtitle={`${analytics.unique_viewers} unique viewers`}
          color="blue"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          title="Booking Requests"
          value={analytics.total_booking_requests}
          subtitle={`${analytics.accepted_bookings} accepted`}
          color="green"
        />
        <StatCard
          icon={<Star className="w-5 h-5" />}
          title="Reviews"
          value={analytics.total_reviews}
          subtitle={`${analytics.average_rating.toFixed(1)} avg rating`}
          color="yellow"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          title="Conversion Rate"
          value={
            analytics.total_views > 0
              ? `${((analytics.total_booking_requests / analytics.total_views) * 100).toFixed(1)}%`
              : '0%'
          }
          subtitle="Bookings per view"
          color="purple"
        />
      </div>

      <div className="bg-neutral-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Views Over Time
        </h3>

        <div className="flex items-end justify-between gap-1 h-48">
          {analytics.views_by_day?.slice(-timeRange).map((day, index) => {
            const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0;
            const date = new Date(day.date);
            const showLabel = timeRange === 7 || index % Math.floor(timeRange / 7) === 0;

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center h-40">
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t hover:from-blue-500 hover:to-blue-300 transition-all cursor-pointer relative group"
                    style={{ height: `${height}%`, minHeight: day.views > 0 ? '4px' : '0' }}
                    title={`${date.toLocaleDateString()}: ${day.views} views`}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {day.views} views
                    </div>
                  </div>
                </div>
                {showLabel && (
                  <span className="text-xs text-gray-500 transform -rotate-45 origin-top-left mt-2">
                    {date.getMonth() + 1}/{date.getDate()}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-700/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Award className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-white mb-1">Featured Artist Eligibility</h4>
            <p className="text-sm text-gray-300">
              Your performance metrics are used to determine featured artist of the month. Keep
              engaging with planners, maintaining high ratings, and showcasing your talent to
              increase your chances!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}

function StatCard({ icon, title, value, subtitle, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-600/10 text-blue-400',
    green: 'bg-green-600/10 text-green-400',
    yellow: 'bg-yellow-600/10 text-yellow-400',
    purple: 'bg-purple-600/10 text-purple-400',
  };

  return (
    <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}
