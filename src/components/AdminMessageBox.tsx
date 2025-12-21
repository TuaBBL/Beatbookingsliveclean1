import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { MessageSquare, Send, X, Minimize2, Maximize2 } from 'lucide-react';

type Message = {
  id: string;
  sender: 'admin' | 'user';
  message: string;
  created_at: string;
  read_at: string | null;
};

export default function AdminMessageBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    checkIfAdmin();
  }, []);

  const checkIfAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      setIsAdmin(profile?.is_admin === true);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      const interval = setInterval(loadMessages, 7000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 7000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('admin_messages')
        .select('id, sender, message, created_at, read_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);
      markAdminMessagesAsRead();
      setUnreadCount(0);
    } catch (err) {
      console.error('Unexpected error loading messages:', err);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from('admin_messages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('sender', 'admin')
        .is('read_at', null);

      setUnreadCount(count || 0);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  };

  const markAdminMessagesAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('admin_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('sender', 'admin')
        .is('read_at', null);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('admin_messages')
        .insert({
          user_id: user.id,
          sender: 'user',
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

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    }
    return 'Just now';
  };

  if (isAdmin) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-orange-600 hover:bg-orange-700 text-white rounded-full p-4 shadow-lg transition z-50 flex items-center gap-2"
      >
        <MessageSquare className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 bg-neutral-950 border-2 border-neutral-800 rounded-lg shadow-2xl z-50 flex flex-col transition-all ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[32rem]'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-white">Contact Admin</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-400 hover:text-white transition"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              setIsMinimized(false);
            }}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No messages yet</p>
                <p className="text-gray-600 text-xs mt-1">Send a message to the admin</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-orange-600 text-white'
                    }`}
                  >
                    {msg.sender === 'admin' && (
                      <p className="text-xs font-semibold mb-1 opacity-80">Admin</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    <p className="text-xs mt-1 opacity-75">
                      {formatMessageTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-neutral-800 p-3">
            <div className="flex gap-2">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 bg-neutral-900 text-white border border-neutral-700 rounded px-3 py-2 focus:outline-none focus:border-orange-500 resize-none min-h-[40px] max-h-[100px] text-sm"
                rows={1}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-neutral-800 disabled:text-gray-600 text-white px-4 rounded font-semibold transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Press Enter to send</p>
          </div>
        </>
      )}
    </div>
  );
}
