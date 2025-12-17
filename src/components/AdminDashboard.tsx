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
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Overview</h2>
      <p className="text-gray-400">Data loading...</p>
    </div>
  );
}

function UsersTab() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Users</h2>
      <p className="text-gray-400">Data loading...</p>
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
