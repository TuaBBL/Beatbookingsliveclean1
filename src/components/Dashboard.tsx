import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User } from 'lucide-react';

type Profile = {
  id: string;
  role: 'planner' | 'artist';
  name: string;
  email: string;
  agreed_terms: boolean;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        const { data: profileData, error: fetchError } = await supabase
          .from('profiles')
          .select('id, role, name, email, agreed_terms')
          .eq('id', user.id)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching profile:', fetchError.message);
          setLoading(false);
          return;
        }

        if (!profileData) {
          navigate('/create-profile');
          return;
        }

        if (!profileData.agreed_terms) {
          navigate('/terms-agreement');
          return;
        }

        if (profileData.role === 'planner') {
          navigate('/planner/dashboard');
          return;
        }

        if (profileData.role === 'artist') {
          navigate('/artist/dashboard');
          return;
        }

        setProfile(profileData);
        setLoading(false);
      } catch (err) {
        console.error('Unexpected error:', err);
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-charcoal border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-neon-green">BeatBookingsLive</h1>
              <div className="hidden sm:flex items-center gap-2 text-gray-400">
                <User className="w-4 h-4" />
                <span className="text-sm">{profile.name}</span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-neon-red text-white px-4 py-2 rounded-lg font-semibold hover:bg-neon-red/90 transition text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-8">
          <h2 className="text-2xl font-bold mb-4">Artist Dashboard</h2>
          <p className="text-gray-400 mb-6">Welcome, {profile.name}!</p>
          <p className="text-gray-500">Artist dashboard features coming soon...</p>
        </div>
      </main>
    </div>
  );
}

function PlannerDashboard({ profile }: { profile: Profile }) {
  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Planner Dashboard</h2>
        <p className="text-gray-400">Welcome back, {profile.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard
          title="Events"
          description="Browse and discover upcoming events"
          footer="View events • Mark Going/Not Going • Comment"
          onClick={() => navigate('/events')}
        >
          <p className="text-gray-400 text-sm">
            Discover events in your area and mark your attendance
          </p>
        </DashboardCard>

        <DashboardCard
          title="Bookings"
          description="Manage your artist bookings"
        >
          <p className="text-gray-400 text-sm">
            Booking management coming soon
          </p>
        </DashboardCard>

        <DashboardCard
          title="Saved Artists"
          description="Your favorite artists and performers"
        >
          <p className="text-gray-400 text-sm">
            Artist favorites coming soon
          </p>
        </DashboardCard>
      </div>
    </div>
  );
}

function ArtistDashboard({ profile }: { profile: Profile }) {
  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Artist Dashboard</h2>
        <p className="text-gray-400">Welcome back, {profile.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard
          title="My Profile"
          description="Manage your artist profile and portfolio"
        >
          <p className="text-gray-400 text-sm">
            Profile management coming soon
          </p>
        </DashboardCard>

        <DashboardCard
          title="Events"
          description="Create and manage your events"
          footer="Create events • Manage your listings"
          onClick={() => navigate('/events')}
        >
          <p className="text-gray-400 text-sm">
            Create events and manage your event listings
          </p>
        </DashboardCard>

        <DashboardCard
          title="Bookings"
          description="Track your confirmed bookings"
        >
          <p className="text-gray-400 text-sm">
            Booking tracking coming soon
          </p>
        </DashboardCard>

        <DashboardCard
          title="Availability"
          description="Set your performance schedule"
        >
          <p className="text-gray-400 text-sm">
            Availability calendar coming soon
          </p>
        </DashboardCard>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  footer,
  children,
  onClick,
}: {
  title: string;
  description: string;
  footer?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-charcoal rounded-xl p-6 border border-gray-800 flex flex-col ${
        onClick ? 'cursor-pointer hover:border-neon-green/50 transition' : ''
      }`}
    >
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
      <div className="flex-1 mb-4">{children}</div>
      {footer && (
        <div className="pt-4 border-t border-gray-800">
          <p className="text-neon-green text-xs font-medium">{footer}</p>
        </div>
      )}
    </div>
  );
}
