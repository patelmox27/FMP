import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ParkingSquare, BarChart3,
  Users, BookOpen, LogOut, TrendingUp, Settings
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/lots',       icon: ParkingSquare,   label: 'Parking Lots' },
  { to: '/analytics',  icon: BarChart3,       label: 'Analytics' },
  { to: '/revenue',    icon: TrendingUp,      label: 'Revenue' },
  { to: '/bookings',   icon: BookOpen,        label: 'Bookings' },
  { to: '/users',      icon: Users,           label: 'Users' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-card border-r border-surface-border flex flex-col z-40">
      {/* Brand */}
      <div className="p-5 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <LayoutDashboard size={18} className="text-primary" />
          </div>
          <div>
            <p className="font-display font-bold text-on-surface text-sm">FindMyParking</p>
            <p className="text-on-surface-muted text-xs">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            id={`nav-${label.toLowerCase().replace(' ','-')}`}
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-primary/15 text-primary border-l-2 border-primary pl-[10px]'
                  : 'text-on-surface-muted hover:bg-surface-hover hover:text-on-surface'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer / User */}
      <div className="p-3 border-t border-surface-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold uppercase">
            {user?.name?.[0] || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-on-surface text-xs font-semibold truncate">{user?.name || 'Admin'}</p>
            <p className="text-on-surface-muted text-xs truncate">{user?.email || ''}</p>
          </div>
        </div>
        <button
          id="logout-btn"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-on-surface-muted hover:bg-accent-red/10 hover:text-accent-red transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
