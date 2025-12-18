import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Header from './Header';
import Footer from './Footer';
import { Shield, Users, Calendar, DollarSign, Wrench, BarChart3, Search, MessageCircle, Trash2, ArrowLeft } from 'lucide-react';

type Tab = 'overview' | 'users' | 'events' | 'subscriptions' | 'utilities';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, role')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.is_admin) {
        navigate('/planner/dashboard');
        return;
      }

      setLoading(false);
    } catch (err) {
      console.error('Error checking admin access:', err);
      navigate('/planner/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => navigate('/planner/dashboard')}
              className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              title="Back to dashboard"
            >
              <ArrowLeft className="w-6 h-6 text-gray-400 hover:text-white" />
            </button>
            <Shield className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl md:text-4xl font-bold">Admin Dashboard</h1>
          </div>

          <div className="flex flex-wrap gap-2 mb-8 border-b border-neutral-800">
            <TabButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              icon={<BarChart3 className="w-4 h-4" />}
            >
              Overview
            </TabButton>
            <TabButton
              active={activeTab === 'users'}
              onClick={() => setActiveTab('users')}
              icon={<Users className="w-4 h-4" />}
            >
              Users
            </TabButton>
            <TabButton
              active={activeTab === 'events'}
              onClick={() => setActiveTab('events')}
              icon={<Calendar className="w-4 h-4" />}
            >
              Events
            </TabButton>
            <TabButton
              active={activeTab === 'subscriptions'}
              onClick={() => setActiveTab('subscriptions')}
              icon={<DollarSign className="w-4 h-4" />}
            >
              Subscriptions
            </TabButton>
            <TabButton
              active={activeTab === 'utilities'}
              onClick={() => setActiveTab('utilities')}
              icon={<Wrench className="w-4 h-4" />}
            >
              Utilities
            </TabButton>
          </div>

          <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-8">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'events' && <EventsTab />}
            {activeTab === 'subscriptions' && <SubscriptionsTab />}
            {activeTab === 'utilities' && <UtilitiesTab />}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
        active
          ? 'text-purple-500 border-purple-500'
          : 'text-gray-400 border-transparent hover:text-white'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_platform_stats');
      if (error) throw error;
      setStats(data?.[0] || null);
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-gray-400">Loading statistics...</p>;
  }

  if (!stats) {
    return <p className="text-gray-400">No data available</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Platform Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={stats.total_users}
          icon={<Users className="w-6 h-6" />}
        />
        <StatCard
          title="Planners"
          value={stats.total_planners}
          icon={<Calendar className="w-6 h-6" />}
        />
        <StatCard
          title="Artists"
          value={stats.total_artists}
          icon={<Users className="w-6 h-6" />}
        />
        <StatCard
          title="Admins"
          value={stats.total_admins}
          icon={<Shield className="w-6 h-6" />}
        />
        <StatCard
          title="Active Subscriptions"
          value={stats.active_subscriptions}
          icon={<DollarSign className="w-6 h-6" />}
        />
        <StatCard
          title="Total Events"
          value={stats.total_events}
          icon={<Calendar className="w-6 h-6" />}
        />
        <StatCard
          title="Published Events"
          value={stats.published_events}
          icon={<Calendar className="w-6 h-6" />}
        />
        <StatCard
          title="New Users (7 days)"
          value={stats.users_last_7_days}
          icon={<BarChart3 className="w-6 h-6" />}
        />
        <StatCard
          title="New Users (30 days)"
          value={stats.users_last_30_days}
          icon={<BarChart3 className="w-6 h-6" />}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">{title}</span>
        <div className="text-blue-500">{icon}</div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function UsersTab() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.name?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query) ||
            [user.city, user.state, user.country]
              .filter(Boolean)
              .join(', ')
              .toLowerCase()
              .includes(query)
        )
      );
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_users');
      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_platform_stats');
      if (error) throw error;
      setStats(data?.[0] || null);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleMessage = (userId: string) => {
    navigate('/planner/inbox');
  };

  if (loading) {
    return <p className="text-gray-400">Loading users...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Users</h2>
        {stats && (
          <div className="flex gap-4 text-sm">
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full">
              {stats.total_planners} Planners
            </span>
            <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full">
              {stats.total_artists} Artists
            </span>
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <p className="text-gray-400">No users found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Location</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Created</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Last Active</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-neutral-800 hover:bg-neutral-800/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {user.name}
                      {user.is_admin && (
                        <Shield className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm">{user.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'artist'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm">
                    {[user.city, user.state, user.country].filter(Boolean).join(', ') || '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm">
                    {user.last_active_at
                      ? new Date(user.last_active_at).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleMessage(user.id)}
                      className="p-2 hover:bg-neutral-700 rounded transition-colors"
                      title="Send message"
                    >
                      <MessageCircle className="w-4 h-4 text-blue-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EventsTab() {
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEvents(events);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredEvents(
        events.filter(
          (event) =>
            event.title?.toLowerCase().includes(query) ||
            event.creator_name?.toLowerCase().includes(query) ||
            event.venue?.toLowerCase().includes(query) ||
            [event.city, event.state, event.country]
              .filter(Boolean)
              .join(', ')
              .toLowerCase()
              .includes(query)
        )
      );
    }
  }, [searchQuery, events]);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_events');
      if (error) throw error;
      setEvents(data || []);
      setFilteredEvents(data || []);
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-gray-400">Loading events...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Events</h2>
        <span className="text-sm text-gray-400">{filteredEvents.length} events</span>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, creator, venue, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <p className="text-gray-400">No events found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Event Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Creator</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Times</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Venue</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Location</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id} className="border-b border-neutral-800 hover:bg-neutral-800/50">
                  <td className="py-3 px-4">{event.title}</td>
                  <td className="py-3 px-4 text-gray-400 text-sm">
                    {event.creator_name || '-'}
                    <span className="ml-2 text-xs text-gray-500">({event.creator_role})</span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm">
                    {event.event_date ? new Date(event.event_date).toLocaleDateString() : '-'}
                    {event.event_end_date && event.event_end_date !== event.event_date && (
                      <span> - {new Date(event.event_end_date).toLocaleDateString()}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm">
                    {event.start_time || '-'} - {event.end_time || '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm">{event.venue || '-'}</td>
                  <td className="py-3 px-4 text-gray-400 text-sm">
                    {[event.city, event.state, event.country].filter(Boolean).join(', ') || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        event.status === 'published'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-gray-500/10 text-gray-400'
                      }`}
                    >
                      {event.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SubscriptionsTab() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSubscriptions(subscriptions);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredSubscriptions(
        subscriptions.filter(
          (sub) =>
            sub.user_name?.toLowerCase().includes(query) ||
            sub.stage_name?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, subscriptions]);

  const loadSubscriptions = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_subscriptions');
      if (error) throw error;
      setSubscriptions(data || []);
      setFilteredSubscriptions(data || []);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to delete this subscription?')) {
      return;
    }

    setDeleting(subscriptionId);
    try {
      const { error } = await supabase.rpc('admin_delete_subscription', {
        subscription_id: subscriptionId,
      });
      if (error) throw error;
      await loadSubscriptions();
    } catch (err) {
      console.error('Error deleting subscription:', err);
      alert('Failed to delete subscription');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return <p className="text-gray-400">Loading subscriptions...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Subscriptions</h2>
        <span className="text-sm text-gray-400">{filteredSubscriptions.length} subscriptions</span>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or stage name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {filteredSubscriptions.length === 0 ? (
        <p className="text-gray-400">No subscriptions found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Stage Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Plan</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Started</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Ends</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.map((sub) => (
                <tr key={sub.id} className="border-b border-neutral-800 hover:bg-neutral-800/50">
                  <td className="py-3 px-4">{sub.user_name || '-'}</td>
                  <td className="py-3 px-4 text-gray-400 text-sm">{sub.stage_name || '-'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-400">
                      {sub.plan}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        sub.status === 'active'
                          ? 'bg-green-500/10 text-green-400'
                          : sub.status === 'cancelled'
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-gray-500/10 text-gray-400'
                      }`}
                    >
                      {sub.is_active ? 'Active' : sub.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm">
                    {sub.started_at ? new Date(sub.started_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm">
                    {sub.ends_at ? new Date(sub.ends_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDelete(sub.id)}
                      disabled={deleting === sub.id}
                      className="p-2 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                      title="Delete subscription"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UtilitiesTab() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Utilities</h2>
      <p className="text-gray-400">Data loading...</p>
    </div>
  );
}
