import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, X } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: number;
  created_at: string;
}

export default function HomepageAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAnnouncements();
    loadDismissed();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_announcements')
        .select('id, title, message, priority, created_at')
        .eq('is_active', true)
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

  const loadDismissed = () => {
    try {
      const stored = localStorage.getItem('dismissedAnnouncements');
      if (stored) {
        setDismissed(new Set(JSON.parse(stored)));
      }
    } catch (err) {
      console.error('Error loading dismissed announcements:', err);
    }
  };

  const handleDismiss = (id: string) => {
    const newDismissed = new Set(dismissed);
    newDismissed.add(id);
    setDismissed(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(Array.from(newDismissed)));
  };

  const visibleAnnouncements = announcements.filter((a) => !dismissed.has(a.id));

  if (loading || visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="relative z-10 px-6 pt-6">
      <div className="max-w-5xl mx-auto">
        <div className="space-y-3">
          {visibleAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-2 border-blue-700/50 rounded-lg p-4 backdrop-blur-sm"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-blue-400" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-lg mb-1">
                    {announcement.title}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {announcement.message}
                  </p>
                </div>

                <button
                  onClick={() => handleDismiss(announcement.id)}
                  className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
                  title="Dismiss"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
