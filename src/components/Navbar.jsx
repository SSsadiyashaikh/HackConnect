import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiBell, FiHome, FiUsers, FiChevronDown } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: brand */}
          <div className="flex items-center min-w-0">
            <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary-600 text-white flex items-center justify-center text-sm font-bold">
                HC
              </div>
              <span className="text-lg font-semibold tracking-tight text-slate-900 hidden sm:inline">
                HackConnect
              </span>
            </Link>
          </div>

          {/* Center: nav links */}
          {user && (
            <nav className="hidden md:flex items-center justify-center flex-1 gap-6 text-sm font-medium text-slate-600">
              <Link
                to={user.role === 'organizer' ? '/organizer/dashboard' : '/dashboard'}
                className={`inline-flex items-center gap-1 pb-1 border-b-2 transition-colors ${
                  isActive('/dashboard') || isActive('/organizer/dashboard')
                    ? 'border-primary-600 text-slate-900'
                    : 'border-transparent hover:border-slate-200 hover:text-slate-900'
                }`}
              >
                <FiHome className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/hackathons"
                className={`inline-flex items-center gap-1 pb-1 border-b-2 transition-colors ${
                  isActive('/hackathons')
                    ? 'border-primary-600 text-slate-900'
                    : 'border-transparent hover:border-slate-200 hover:text-slate-900'
                }`}
              >
                <span>Hackathons</span>
              </Link>

              {user.role === 'student' && (
                <Link
                  to="/teams"
                  className={`inline-flex items-center gap-1 pb-1 border-b-2 transition-colors ${
                    isActive('/teams')
                      ? 'border-primary-600 text-slate-900'
                      : 'border-transparent hover:border-slate-200 hover:text-slate-900'
                  }`}
                >
                  <FiUsers className="h-4 w-4" />
                  <span>Teams</span>
                </Link>
              )}

              <Link
                to="/notifications"
                className={`inline-flex items-center gap-1 pb-1 border-b-2 transition-colors ${
                  isActive('/notifications')
                    ? 'border-primary-600 text-slate-900'
                    : 'border-transparent hover:border-slate-200 hover:text-slate-900'
                }`}
              >
                <FiBell className="h-4 w-4" />
                <span>Notifications</span>
              </Link>
            </nav>
          )}

          {/* Right: user menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full bg-slate-100 px-2 py-1 text-sm text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white text-sm font-semibold">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:inline max-w-[120px] truncate">{user.name}</span>
                <FiChevronDown className="h-4 w-4" />
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-44 rounded-lg bg-white py-2 shadow-lg ring-1 ring-slate-900/5">
                  <button
                    onClick={() => {
                      setOpen(false);
                      navigate('/profile');
                    }}
                    className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-slate-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
