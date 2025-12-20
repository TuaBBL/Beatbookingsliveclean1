import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Bell, Check, X, CheckCheck } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsBox() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadNotifications() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async function markAllAsRead() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  async function deleteNotification(id: string) {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  function handleNotificationClick(notification: Notification) {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'booking_request':
        return '📩';
      case 'booking_accepted':
        return '✅';
      case 'booking_declined':
        return '❌';
      case 'booking_cancelled':
        return '🚫';
      case 'new_review':
        return '⭐';
      default:
        return '🔔';
    }
  }

  function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const displayedNotifications = showAll
    ? notifications
    : notifications.slice(0, 5);

  return (
    <div className="bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden">
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-bold">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-orange-600 text-white text-xs font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition"
            title="Mark all as read"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
            <p className="text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <>
            {displayedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`relative border-b border-neutral-800 last:border-0 transition ${
                  notification.is_read
                    ? 'bg-neutral-900'
                    : 'bg-neutral-800/50 hover:bg-neutral-800'
                } ${notification.link ? 'cursor-pointer' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="p-4 pr-12">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="absolute top-4 right-4 flex gap-1">
                  {!notification.is_read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="p-1 text-gray-500 hover:text-green-500 hover:bg-neutral-800 rounded transition"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="p-1 text-gray-500 hover:text-red-500 hover:bg-neutral-800 rounded transition"
                    title="Delete"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {notifications.length > 5 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full py-3 text-sm text-gray-400 hover:text-white hover:bg-neutral-800 transition"
              >
                {showAll
                  ? 'Show less'
                  : `Show ${notifications.length - 5} more`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
