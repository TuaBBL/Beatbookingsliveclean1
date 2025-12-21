import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MessageSquare, Send, Users, ArrowLeft, Clock, UserPlus } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

type Conversation = {
  user_id: string;
  name: string;
  email: string;
  role: 'artist' | 'planner';
  last_message_at: string;
  unread_count: number;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: 'artist' | 'planner';
  last_active_at: string | null;
};

type Message = {
  id: string;
  sender: 'admin' | 'user';
  message: string;
  created_at: string;
  read_at: string | null;
};

type Profile = {
  id: string;
  last_active_at: string | null;
};

export default function AdminMessages() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [viewMode, setViewMode] = useState<'conversations' | 'all-users'>('conversations');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'all' | 'artist' | 'planner'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedUserProfile, setSelectedUserProfile] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (loading) return;
    loadConversations();
    loadAllUsers();
    const interval = setInterval(() => {
      loadConversations();
      loadAllUsers();
    }, 7000);
    return () => clearInterval(interval);
  }, [loading, roleFilter, statusFilter]);

  useEffect(() => {
    if (!selectedUserId) return;
    loadMessages();
    markMessagesAsRead();
    const interval = setInterval(loadMessages, 7000);
    return () => clearInterval(interval);
  }, [selectedUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
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

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_conversations');

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      let filtered = data || [];

      if (roleFilter !== 'all') {
        filtered = filtered.filter((c: Conversation) => c.role === roleFilter);
      }

      if (statusFilter === 'unread') {
        filtered = filtered.filter((c: Conversation) => c.unread_count > 0);
      } else if (statusFilter === 'read') {
        filtered = filtered.filter((c: Conversation) => c.unread_count === 0);
      }

      setConversations(filtered);
    } catch (err) {
      console.error('Unexpected error loading conversations:', err);
    }
  };

  const loadAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, last_active_at')
        .in('role', ['artist', 'planner'])
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      let filtered = data || [];

      if (roleFilter !== 'all') {
        filtered = filtered.filter((u: User) => u.role === roleFilter);
      }

      setAllUsers(filtered);
    } catch (err) {
      console.error('Unexpected error loading users:', err);
    }
  };

  const loadMessages = async () => {
    if (!selectedUserId) return;

    try {
      const { data, error } = await supabase
        .from('admin_messages')
        .select('id, sender, message, created_at, read_at')
        .eq('user_id', selectedUserId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, last_active_at')
        .eq('id', selectedUserId)
        .maybeSingle();

      setSelectedUserProfile(profile);
    } catch (err) {
      console.error('Unexpected error loading messages:', err);
    }
  };

  const markMessagesAsRead = async () => {
    if (!selectedUserId) return;

    try {
      await supabase
        .from('admin_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', selectedUserId)
        .eq('sender', 'user')
        .is('read_at', null);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const sendMessage = async () => {
    if (!selectedUserId || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('admin_messages')
        .insert({
          user_id: selectedUserId,
          sender: 'admin',
          message: newMessage.trim(),
        });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setNewMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      await loadMessages();
      await loadConversations();
    } catch (err) {
      console.error('Unexpected error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const selectedConversation = conversations.find(c => c.user_id === selectedUserId);
  const selectedUser = allUsers.find(u => u.id === selectedUserId);

  const displayList = viewMode === 'conversations' ? conversations : allUsers;
  const filteredDisplayList = displayList.filter((item) => {
    if (!searchQuery) return true;
    const name = 'name' in item ? item.name : '';
    const email = item.email;
    const searchLower = searchQuery.toLowerCase();
    return name?.toLowerCase().includes(searchLower) || email.toLowerCase().includes(searchLower);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col">
        <div className="border-b border-neutral-800 bg-neutral-950">
          <div className="max-w-[1800px] mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-white transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-orange-500" />
                <h1 className="text-2xl font-bold text-white">Admin Messages</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-full md:w-[30%] border-r border-neutral-800 flex flex-col bg-neutral-950">
            <div className="p-4 border-b border-neutral-800 space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('conversations')}
                  className={`flex-1 px-3 py-2 rounded text-sm font-semibold transition ${
                    viewMode === 'conversations'
                      ? 'bg-orange-600 text-white'
                      : 'bg-neutral-900 text-gray-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  Active
                </button>
                <button
                  onClick={() => setViewMode('all-users')}
                  className={`flex-1 px-3 py-2 rounded text-sm font-semibold transition ${
                    viewMode === 'all-users'
                      ? 'bg-orange-600 text-white'
                      : 'bg-neutral-900 text-gray-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-4 h-4 inline mr-1" />
                  All Users
                </button>
              </div>

              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full bg-neutral-900 text-white border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="w-full bg-neutral-900 text-white border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="all">All Roles</option>
                  <option value="artist">Artist</option>
                  <option value="planner">Planner</option>
                </select>
              </div>

              {viewMode === 'conversations' && (
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full bg-neutral-900 text-white border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                  >
                    <option value="all">All Messages</option>
                    <option value="unread">Unread</option>
                    <option value="read">Read</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredDisplayList.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    {viewMode === 'conversations' ? 'No conversations yet' : 'No users found'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-800">
                  {filteredDisplayList.map((item) => {
                    const isConversation = 'unread_count' in item;
                    const userId = 'user_id' in item ? item.user_id : item.id;
                    const name = item.name || item.email;
                    const role = item.role;
                    const unreadCount = isConversation ? item.unread_count : 0;
                    const lastMessageAt = isConversation ? item.last_message_at : null;
                    const lastActiveAt = !isConversation && 'last_active_at' in item ? item.last_active_at : null;

                    return (
                      <button
                        key={userId}
                        onClick={() => setSelectedUserId(userId)}
                        className={`w-full p-4 text-left transition hover:bg-neutral-900 ${
                          selectedUserId === userId ? 'bg-neutral-900' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate">
                              {name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                role === 'artist'
                                  ? 'bg-blue-500/10 text-blue-400'
                                  : 'bg-green-500/10 text-green-400'
                              }`}>
                                {role}
                              </span>
                            </div>
                          </div>
                          {unreadCount > 0 && (
                            <div className="flex-shrink-0 ml-2">
                              <span className="bg-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                {unreadCount}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {lastMessageAt
                              ? formatRelativeTime(lastMessageAt)
                              : lastActiveAt
                              ? `Active ${formatRelativeTime(lastActiveAt)}`
                              : 'No messages'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-black">
            {selectedUserId && (selectedConversation || selectedUser) ? (
              <>
                <div className="border-b border-neutral-800 bg-neutral-950 p-4">
                  <div className="max-w-4xl mx-auto">
                    <h2 className="text-xl font-bold text-white mb-1">
                      {(selectedConversation?.name || selectedUser?.name) || (selectedConversation?.email || selectedUser?.email)}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span>{selectedConversation?.email || selectedUser?.email}</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        (selectedConversation?.role || selectedUser?.role) === 'artist'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-green-500/10 text-green-400'
                      }`}>
                        {selectedConversation?.role || selectedUser?.role}
                      </span>
                      {(selectedUserProfile?.last_active_at || selectedUser?.last_active_at) && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Active {formatRelativeTime(selectedUserProfile?.last_active_at || selectedUser?.last_active_at || '')}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <div className="max-w-4xl mx-auto space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500">No messages yet</p>
                        <p className="text-gray-600 text-sm mt-2">Start the conversation by sending a message below</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              msg.sender === 'admin'
                                ? 'bg-orange-600 text-white'
                                : 'bg-neutral-900 text-white border border-neutral-800'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                            <p className={`text-xs mt-1 ${
                              msg.sender === 'admin' ? 'text-orange-100' : 'text-gray-500'
                            }`}>
                              {formatMessageTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <div className="border-t border-neutral-800 bg-neutral-950 p-4">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex gap-3">
                      <textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                        className="flex-1 bg-neutral-900 text-white border border-neutral-700 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 resize-none min-h-[44px] max-h-[200px]"
                        rows={1}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="bg-orange-600 hover:bg-orange-700 disabled:bg-neutral-800 disabled:text-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500">Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
