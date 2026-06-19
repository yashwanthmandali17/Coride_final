import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Bell, MapPin, User, LogOut, Calendar, PlusCircle, Search, Menu, X, Route, Sun, Moon, History } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('coride_theme') || 'dark');
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    };

    if (showNotifDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifDropdown]);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  const [animateSpin, setAnimateSpin] = useState(false);

  const toggleTheme = () => {
    setAnimateSpin(true);
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('coride_theme', nextTheme);
    setTimeout(() => setAnimateSpin(false), 400);
  };

  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  if (!user) return null;

  return (
    <nav style={styles.nav}>
      <div style={styles.navContainer}>
        {/* Brand Logo */}
        <Link to="/" style={styles.logo}>
          <div style={styles.logoBadge}>
            <Route size={22} style={{ color: 'var(--accent-secondary)' }} />
          </div>
          <span style={styles.logoText}>Co<span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Ride</span></span>
        </Link>

        {/* Desktop Navigation Links */}
        <div style={styles.navLinks}>
          <Link to="/dashboard" style={isActive('/dashboard') ? styles.activeLink : styles.link}>
            <Calendar size={16} /> Dashboard
          </Link>
          <Link to="/" style={isActive('/') ? styles.activeLink : styles.link}>
            <Search size={16} /> Search Rides
          </Link>
          <Link to="/publish" style={isActive('/publish') ? styles.activeLink : styles.link}>
            <PlusCircle size={16} /> Publish Ride
          </Link>
          <Link to="/history" style={isActive('/history') ? styles.activeLink : styles.link}>
            <History size={16} /> History
          </Link>
          <Link to="/profile" style={isActive('/profile') ? styles.activeLink : styles.link}>
            <User size={16} /> Profile
          </Link>
        </div>

        {/* Action Controls */}
        <div style={styles.navActions}>
          {/* Notification Bell */}
          <div style={styles.notifContainer} ref={notifRef}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              style={styles.actionBtn}
              title="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
            </button>

            {showNotifDropdown && (
              <div style={styles.dropdown} className="animate-slide">
                <div style={styles.dropdownHeader}>
                  <h4>Notifications</h4>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} style={styles.clearBtn}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div style={styles.dropdownList}>
                  {notifications.length === 0 ? (
                    <div style={styles.emptyNotif}>No notifications yet.</div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markAsRead(notif.id);
                          setShowNotifDropdown(false);
                          if (notif.ride_id) {
                            navigate(`/rides/${notif.ride_id}`);
                          }
                        }}
                        style={{
                          ...styles.notifItem,
                          cursor: 'pointer',
                          backgroundColor: notif.read_status ? 'transparent' : 'rgba(124, 77, 255, 0.05)',
                        }}
                      >
                        <div style={styles.notifTitle}>
                          {notif.title}
                          {!notif.read_status && <span style={styles.unreadDot} />}
                        </div>
                        <div style={styles.notifMsg}>{notif.message}</div>
                        <div style={styles.notifTime}>
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{ ...styles.actionBtn, marginRight: '0.2rem' }}
            className={animateSpin ? 'theme-spin-click' : ''}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? <Sun size={20} color="var(--warning)" /> : <Moon size={20} color="var(--accent-primary)" />}
          </button>

          {/* User profile info & Logout */}
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user.name}</span>
            <button onClick={handleLogout} style={styles.logoutBtn} title="Sign Out">
              <LogOut size={18} />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button style={styles.menuBtn} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={styles.mobileDrawer} className="glass-panel">
          <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} style={styles.mobileLink}>
            Dashboard
          </Link>
          <Link to="/" onClick={() => setMobileMenuOpen(false)} style={styles.mobileLink}>
            Search Rides
          </Link>
          <Link to="/publish" onClick={() => setMobileMenuOpen(false)} style={styles.mobileLink}>
            Publish Ride
          </Link>
          <Link to="/history" onClick={() => setMobileMenuOpen(false)} style={styles.mobileLink}>
            History
          </Link>
          <Link to="/profile" onClick={() => setMobileMenuOpen(false)} style={styles.mobileLink}>
            Profile
          </Link>
          <button onClick={handleLogout} style={styles.mobileLogout}>
            <LogOut size={18} /> Log Out
          </button>
        </div>
      )}
    </nav>
  );
};

const styles = {
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '70px',
    background: 'var(--glass-bg)',
    backdropFilter: 'var(--glass-blur)',
    borderBottom: '1px solid var(--border-color)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
  },
  navContainer: {
    maxWidth: '1400px',
    width: '100%',
    margin: '0 auto',
    padding: '0 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  logoBadge: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(124, 77, 255, 0.12) 0%, rgba(0, 229, 255, 0.12) 100%)',
    borderRadius: '10px',
    border: '1px solid rgba(124, 77, 255, 0.2)',
    boxShadow: '0 0 10px rgba(124, 77, 255, 0.15)',
  },
  logoText: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.4rem',
    fontWeight: 700,
    letterSpacing: '-0.03em',
  },
  navLinks: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'center',
  },
  link: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    transition: 'color var(--transition-fast)',
  },
  activeLink: {
    color: 'var(--accent-primary)',
    fontSize: '0.95rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  navActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  notifContainer: {
    position: 'relative',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    position: 'relative',
    padding: '0.4rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color var(--transition-fast), color var(--transition-fast)',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    background: 'var(--accent-primary)',
    color: '#fff',
    fontSize: '0.65rem',
    fontWeight: 700,
    borderRadius: '50%',
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: '45px',
    right: 0,
    width: '320px',
    maxHeight: '400px',
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem',
    zIndex: 1001,
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--glass-shadow)',
  },
  dropdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '0.5rem',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent-primary)',
    fontSize: '0.75rem',
    cursor: 'pointer',
    fontWeight: 600,
  },
  dropdownList: {
    overflowY: 'auto',
    flex: 1,
  },
  emptyNotif: {
    padding: '2rem 1rem',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
  },
  notifItem: {
    padding: '0.75rem',
    borderRadius: 'var(--radius-sm)',
    marginBottom: '0.5rem',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)',
  },
  notifTitle: {
    fontWeight: 600,
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-primary)',
  },
  notifMsg: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginTop: '0.2rem',
  },
  notifTime: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    marginTop: '0.4rem',
    textAlign: 'right',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
    paddingLeft: '1rem',
    borderLeft: '1px solid var(--border-color)',
  },
  userName: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '0.4rem',
    display: 'flex',
    alignItems: 'center',
    transition: 'color var(--transition-fast)',
  },
  menuBtn: {
    display: 'none',
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
  mobileDrawer: {
    position: 'absolute',
    top: '70px',
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.5rem',
    zIndex: 999,
    borderRadius: 0,
    borderLeft: 'none',
    borderRight: 'none',
  },
  mobileLink: {
    fontSize: '1.1rem',
    fontWeight: 600,
    padding: '0.5rem 0',
  },
  mobileLogout: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'none',
    border: 'none',
    color: 'var(--danger)',
    fontSize: '1.1rem',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '0.5rem 0',
    textAlign: 'left',
  },
};

// Add responsive media query handlers in global CSS, but here's CSS override inline:
if (typeof window !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    @media (max-width: 768px) {
      nav div[style*="navLinks"] { display: none !important; }
      nav div[style*="userInfo"] { display: none !important; }
      nav button[style*="menuBtn"] { display: block !important; }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default Navbar;
