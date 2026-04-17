import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CarFront, LogOut, User as UserIcon, Bell, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { getUserNotifications, markAsRead } from '../api/notification';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, handleLogout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?._id) {
      fetchNotifications();
      const socket = io(import.meta.env.VITE_API_BASE_URL || "http://localhost:3001");
      
      socket.on("newNotification", (notif) => {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast(notif.message, {
           icon: '🔔',
           duration: 5000,
        });
      });

      return () => socket.disconnect();
    }
  }, [user?._id]);


  const fetchNotifications = async () => {
    if (!user?._id) return;
    try {
      const res = await getUserNotifications(user._id);
      if (res && res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.notifications.filter(n => !n.read).length);
      }
    } catch (err) {
      // Error is handled by apiClient interceptor, but we catch it here to prevent crash
      console.log("Notifications fetch failed (likely unauthorized)", err.message);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const onLogout = () => {
    handleLogout();
    navigate('/login');
  };

  return (
    <nav className="glass flex justify-between items-center px-8 py-4 sticky top-0 z-50 border-b border-outline-variant/20">
      <Link to="/" className="flex items-center gap-2 decoration-transparent group">
        <CarFront className="text-primary group-hover:text-primary-container transition-colors" size={32} />
        <span className="font-display font-bold text-2xl text-primary">FindMyParking</span>
      </Link>

      <div className="flex items-center gap-6">
        <Link to="/parking" className="text-on-surface font-medium hover:text-primary transition-colors">Browse Parking</Link>
        {user ? (
          <>
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 rounded-full hover:bg-surface-hover relative transition-colors"
              >
                <Bell size={22} className={unreadCount > 0 ? "text-primary animate-pulse" : "text-tertiary"} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-accent-red text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-surface">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-4 w-80 bg-surface-container border border-outline-variant/30 rounded-3xl shadow-2xl p-4 animate-scale-in">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant/10">
                    <h3 className="font-bold text-sm">Notifications</h3>
                    <button onClick={() => setShowDropdown(false)}><X size={14} /></button>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {notifications.length === 0 ? (
                      <p className="text-center py-8 text-xs text-tertiary">All caught up!</p>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n._id} 
                          onClick={() => !n.read && handleMarkRead(n._id)}
                          className={`p-3 rounded-2xl text-xs transition-colors cursor-pointer ${n.read ? 'bg-surface-low opacity-60' : 'bg-primary/5 hover:bg-primary/10 border-l-2 border-primary'}`}
                        >
                          <p className="font-medium mb-1">{n.message}</p>
                          <p className="text-[10px] text-tertiary">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link to="/dashboard" className="text-on-surface flex items-center gap-2 hover:text-primary transition-colors">
              <UserIcon size={20} /> Dashboard
            </Link>
            <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant/20 text-primary hover:shadow-[0_0_15px_theme(colors.secondary.container)] hover:-translate-y-0.5 transition-all">
              <LogOut size={16} /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-on-surface font-medium hover:text-primary transition-colors">Login</Link>
            <Link to="/register" className="px-6 py-2 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-display font-bold hover:-translate-y-0.5 hover:shadow-[0_4px_32px_rgba(226,226,232,0.08)] transition-all">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

