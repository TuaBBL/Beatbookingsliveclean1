import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Header from './Header';
import Footer from './Footer';
import { Shield, Users, Calendar, DollarSign, Wrench, BarChart3, Search, MessageCircle, Trash2, ArrowLeft, Bell } from 'lucide-react';

type Tab = 'overview' | 'users' | 'events' | 'subscriptions' | 'announcements' | 'utilities';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 7000);
      return () => clearInterval(interval);
    }
  }, [loading]);

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

  const loadUnreadCount = async () => {
    try {
      const { count } = await supabase
        .from('admin_messages')
        .select('id', { count: 'exact', head: true })
        .eq('sender', 'user')
        .is('read_at', null);

      setUnreadMessageCount(count || 0);
    } catch (err) {
      console.error('Error loading unread count:', err);
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
          <div className="flex items-center justify-between gap-3 mb-8">
            <div className="flex items-center gap-3">
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
            <button
              onClick={() => navigate('/admin/messages')}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition font-semibold relative"
            >
              <MessageCircle className="w-5 h-5" />
              Messages
              {unreadMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadMessageCount}
                </span>
              )}
            </button>
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
              active={activeTab === 'announcements'}
              onClick={() => setActiveTab('announcements')}
              icon={<Bell className="w-4 h-4" />}
            >
              Announcements
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
            {activeTab === 'announcements' && <AnnouncementsTab />}
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
    navigate('/admin/messages');
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
  const [deactivating, setDeactivating] = useState<string | null>(null);

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

  const getStats = () => {
    const total = subscriptions.length;
    const active = subscriptions.filter((s) => s.is_active === true).length;
    const inactive = subscriptions.filter((s) => s.is_active === false).length;
    const founding = subscriptions.filter((s) => s.plan === 'free_forever').length;
    const paid = subscriptions.filter(
      (s) => s.plan === 'standard' || s.plan === 'premium'
    ).length;
    return { total, active, inactive, founding, paid };
  };

  const getEntitlementTier = (sub: any) => {
    return sub.entitlement_tier || 'standard';
  };

  const getSubscriptionType = (plan: string) => {
    if (plan === 'free_forever') return 'Free';
    return 'Paid';
  };

  const canDelete = (sub: any) => {
    if (sub.is_active && (sub.plan === 'standard' || sub.plan === 'premium')) {
      return false;
    }
    return true;
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

  const handleDeactivate = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to deactivate this subscription? This will hide the artist from discovery.')) {
      return;
    }

    setDeactivating(subscriptionId);
    try {
      const { error } = await supabase.rpc('admin_deactivate_subscription', {
        subscription_id: subscriptionId,
      });
      if (error) throw error;
      await loadSubscriptions();
    } catch (err) {
      console.error('Error deactivating subscription:', err);
      alert('Failed to deactivate subscription');
    } finally {
      setDeactivating(null);
    }
  };

  if (loading) {
    return <p className="text-gray-400">Loading subscriptions...</p>;
  }

  const stats = getStats();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Subscriptions</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
          <p className="text-gray-400 text-sm mb-1">Total</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-neutral-800 rounded-lg p-4 border border-green-700/30">
          <p className="text-gray-400 text-sm mb-1">Active</p>
          <p className="text-2xl font-bold text-green-500">{stats.active}</p>
        </div>
        <div className="bg-neutral-800 rounded-lg p-4 border border-red-700/30">
          <p className="text-gray-400 text-sm mb-1">Inactive</p>
          <p className="text-2xl font-bold text-red-500">{stats.inactive}</p>
        </div>
        <div className="bg-neutral-800 rounded-lg p-4 border border-purple-700/30">
          <p className="text-gray-400 text-sm mb-1">Founding Artists</p>
          <p className="text-2xl font-bold text-purple-500">{stats.founding}</p>
        </div>
        <div className="bg-neutral-800 rounded-lg p-4 border border-blue-700/30">
          <p className="text-gray-400 text-sm mb-1">Paid</p>
          <p className="text-2xl font-bold text-blue-500">{stats.paid}</p>
        </div>
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
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Tier</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Stripe</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Started</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Ends</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.map((sub) => {
                const isDeletable = canDelete(sub);
                const isActive = sub.is_active === true;
                const isExpired = sub.ends_at && new Date(sub.ends_at) < new Date();
                const isCancelled = sub.status === 'cancelled';

                let statusBadge = { text: 'Unknown', color: 'bg-gray-500/10 text-gray-400' };
                if (isActive) {
                  statusBadge = { text: 'Active', color: 'bg-green-500/10 text-green-400' };
                } else if (isCancelled) {
                  statusBadge = { text: 'Cancelled', color: 'bg-red-500/10 text-red-400' };
                } else if (isExpired) {
                  statusBadge = { text: 'Expired', color: 'bg-gray-500/10 text-gray-400' };
                } else {
                  statusBadge = { text: 'Inactive', color: 'bg-orange-500/10 text-orange-400' };
                }

                return (
                  <tr key={sub.id} className="border-b border-neutral-800 hover:bg-neutral-800/50">
                    <td className="py-3 px-4">{sub.user_name || '-'}</td>
                    <td className="py-3 px-4 text-gray-400 text-sm">{sub.stage_name || '-'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          sub.plan === 'free_forever'
                            ? 'bg-purple-500/10 text-purple-400'
                            : sub.plan === 'premium'
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-gray-500/10 text-gray-400'
                        }`}
                      >
                        {sub.plan}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {getEntitlementTier(sub)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          getSubscriptionType(sub.plan) === 'Free'
                            ? 'bg-gray-500/10 text-gray-400'
                            : 'bg-green-500/10 text-green-400'
                        }`}
                      >
                        {getSubscriptionType(sub.plan)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          sub.stripe_subscription_id
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-gray-500/10 text-gray-400'
                        }`}
                      >
                        {sub.stripe_subscription_id ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusBadge.color}`}>
                        {statusBadge.text}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {sub.started_at ? new Date(sub.started_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {sub.ends_at ? new Date(sub.ends_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {isActive && (
                          <button
                            onClick={() => handleDeactivate(sub.id)}
                            disabled={deactivating === sub.id}
                            className="p-2 hover:bg-orange-500/10 rounded transition-colors disabled:opacity-50"
                            title="Deactivate subscription"
                          >
                            <span className="text-xs text-orange-400">Deactivate</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(sub.id)}
                          disabled={deleting === sub.id || !isDeletable}
                          className="p-2 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={
                            isDeletable
                              ? 'Delete subscription'
                              : 'Cannot delete active paid subscriptions'
                          }
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AnnouncementsTab() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    is_active: true,
    priority: 0,
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_announcements')
        .select('*')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error('Error loading announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        const { error } = await supabase
          .from('admin_announcements')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('admin_announcements')
          .insert({
            ...formData,
            created_by: user?.id,
          });

        if (error) throw error;
      }

      setFormData({ title: '', message: '', is_active: true, priority: 0 });
      setEditingId(null);
      setShowForm(false);
      loadAnnouncements();
    } catch (err) {
      console.error('Error saving announcement:', err);
      alert('Failed to save announcement');
    }
  };

  const handleEdit = (announcement: any) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      is_active: announcement.is_active,
      priority: announcement.priority,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const { error } = await supabase
        .from('admin_announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadAnnouncements();
    } catch (err) {
      console.error('Error deleting announcement:', err);
      alert('Failed to delete announcement');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_announcements')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      loadAnnouncements();
    } catch (err) {
      console.error('Error toggling announcement:', err);
    }
  };

  const handleCancel = () => {
    setFormData({ title: '', message: '', is_active: true, priority: 0 });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return <p className="text-gray-400">Loading announcements...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Homepage Announcements</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition font-semibold"
        >
          {showForm ? 'Cancel' : 'New Announcement'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-neutral-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Announcement' : 'Create New Announcement'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                required
                placeholder="e.g., New Feature Coming Soon!"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 min-h-24"
                required
                placeholder="Describe the upcoming feature or update..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  min="0"
                />
                <p className="text-xs text-gray-400 mt-1">Lower numbers appear first</p>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer mt-7">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Active (visible to users)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition font-semibold"
            >
              {editingId ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No announcements yet. Create one to notify users about upcoming features!
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`border-2 rounded-lg p-4 ${
                announcement.is_active
                  ? 'border-green-700 bg-green-500/5'
                  : 'border-neutral-700 bg-neutral-800/50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{announcement.title}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        announcement.is_active
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-gray-500/10 text-gray-400'
                      }`}
                    >
                      {announcement.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-400">
                      Priority: {announcement.priority}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-2">{announcement.message}</p>
                  <p className="text-xs text-gray-500">
                    Created {new Date(announcement.created_at).toLocaleDateString()} at{' '}
                    {new Date(announcement.created_at).toLocaleTimeString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActive(announcement.id, announcement.is_active)}
                    className="p-2 hover:bg-neutral-800 rounded-lg transition"
                    title={announcement.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <span className="text-xs text-blue-400">
                      {announcement.is_active ? 'Hide' : 'Show'}
                    </span>
                  </button>
                  <button
                    onClick={() => handleEdit(announcement)}
                    className="p-2 hover:bg-neutral-800 rounded-lg transition"
                    title="Edit"
                  >
                    <span className="text-xs text-purple-400">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
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
