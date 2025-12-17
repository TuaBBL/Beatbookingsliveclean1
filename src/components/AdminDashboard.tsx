import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Header from './Header';
import Footer from './Footer';
import { Shield, Users, Calendar, DollarSign, Wrench, BarChart3 } from 'lucide-react';

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
      const { data, error } = await supabase.rpc('get_user_stats');
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
          title="New (7 days)"
          value={stats.users_last_7_days}
          icon={<BarChart3 className="w-6 h-6" />}
        />
        <StatCard
          title="New (30 days)"
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
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_users');
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_stats');
      if (error) throw error;
      setStats(data?.[0] || null);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
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

      {users.length === 0 ? (
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
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
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
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Events</h2>
      <p className="text-gray-400">Data loading...</p>
    </div>
  );
}

function SubscriptionsTab() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Subscriptions</h2>
      <p className="text-gray-400">Data loading...</p>
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
