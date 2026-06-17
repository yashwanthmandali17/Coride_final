import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import authAPI from '../services/authAPI';
import { MapPin, Mail, Lock, LogIn, AlertCircle, Route, ShieldCheck, MessageSquare, IndianRupee, Sun, Moon, X, User, ArrowRight, UserPlus, Info, CheckCircle } from 'lucide-react';

const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get('expired');
  const showRegisterOnLoad = searchParams.get('register');

  // Modal triggers
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(showRegisterOnLoad === 'true');
  const [isGoogleMockOpen, setIsGoogleMockOpen] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhoto, setRegPhoto] = useState('');

  // Status states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [systemAccount, setSystemAccount] = useState(null);

  // Theme states
  const [theme, setTheme] = useState(localStorage.getItem('coride_theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  useEffect(() => {
    const fetchSystemEmail = async () => {
      try {
        const data = await authAPI.getSystemEmail();
        setSystemAccount(data);
      } catch (err) {
        console.error("Failed to fetch system email:", err);
      }
    };
    fetchSystemEmail();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('coride_theme', nextTheme);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      setIsLoginOpen(false);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register(regName, regEmail, regPassword, regPhoto || null);
      setIsRegisterOpen(false);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Check if email is already in use.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleOAuth = async (selectedEmail, selectedName) => {
    setError('');
    setLoading(true);
    try {
      // Try to register mock google account first. If already exists, log in
      try {
        await register(selectedName, selectedEmail, 'googlePass123', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150');
      } catch (regErr) {
        await login(selectedEmail, 'googlePass123');
      }
      setIsGoogleMockOpen(false);
      setIsLoginOpen(false);
      setIsRegisterOpen(false);
      navigate('/');
    } catch (err) {
      setError('Google login simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.landingWrapper}>
      {/* Header Bar */}
      <header style={styles.header}>
        <div style={styles.headerContainer}>
          <div style={styles.logo}>
            <div style={styles.logoBadge}>
              <Route size={22} style={{ color: 'var(--accent-secondary)' }} />
            </div>
            <span style={styles.logoText}>Co<span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Ride</span></span>
          </div>

          <div style={styles.headerActions}>
            <button onClick={toggleTheme} style={styles.themeToggle} title="Toggle Dark/Light Theme">
              {theme === 'dark' ? <Sun size={18} color="var(--warning)" /> : <Moon size={18} color="var(--accent-primary)" />}
            </button>
            <button onClick={() => { setError(''); setIsLoginOpen(true); }} style={styles.loginBtnHeader}>
              Sign In
            </button>
            <button onClick={() => { setError(''); setIsRegisterOpen(true); }} className="btn btn-primary" style={styles.signUpBtnHeader}>
              Join Now
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroContainer}>
          <div style={styles.heroContent}>
            <div style={styles.badgePromo}>🚀 SMART COMMUNITY RIDE SHARING</div>
            <h1 style={styles.heroTitle}>
              Ride Together<br />
              <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Save Together</span>
            </h1>
            <p style={styles.heroText}>
              CoRide is the ultimate modular ride-sharing platform designed for communities, workplaces, and daily commuters. Coordinate trips, split fuel costs accurately, and travel sustainably together.
            </p>
            <div style={styles.heroCTA}>
              <button onClick={() => { setError(''); setIsRegisterOpen(true); }} className="btn btn-primary" style={styles.ctaPrimary}>
                Get Started <ArrowRight size={18} />
              </button>
              <button onClick={() => { setError(''); setIsLoginOpen(true); }} className="btn btn-secondary" style={styles.ctaSecondary}>
                Commute Now
              </button>
            </div>
            
            {/* Quick Stats Grid */}
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <span style={styles.statVal}>5000+</span>
                <span style={styles.statLabel}>Active Commuters</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statVal}>12k+</span>
                <span style={styles.statLabel}>Rides Shared</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statVal}>₹2.5L+</span>
                <span style={styles.statLabel}>Fuel Costs Saved</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Flash Cards Section */}
      <section style={styles.flashcardSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Commute Smarter with CoRide</h2>
          <p style={styles.sectionSubtitle}>Discover key features tailored for modern ride-sharing operations.</p>
        </div>

        <div style={styles.flashcardsGrid}>
          {/* Card 1 */}
          <div className="glass-panel glass-panel-hover" style={styles.flashcard}>
            <div style={{ ...styles.cardIconBox, backgroundColor: 'rgba(0, 229, 255, 0.1)', color: 'var(--accent-secondary)' }}>
              <Route size={24} />
            </div>
            <h3 style={styles.cardTitle}>Smart Route Search</h3>
            <p style={styles.cardDesc}>
              Enter your pickup and destination locations. Our system matches you with drivers taking similar routes within your desired search radius.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel glass-panel-hover" style={styles.flashcard}>
            <div style={{ ...styles.cardIconBox, backgroundColor: 'rgba(0, 230, 118, 0.1)', color: 'var(--success)' }}>
              <IndianRupee size={24} />
            </div>
            <h3 style={styles.cardTitle}>Fair Cost Share</h3>
            <p style={styles.cardDesc}>
              Say goodbye to guesswork. Enter your fuel price and vehicle mileage. Our Leaflet map distance automatically calculates price per seat.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel glass-panel-hover" style={styles.flashcard}>
            <div style={{ ...styles.cardIconBox, backgroundColor: 'rgba(124, 77, 255, 0.1)', color: 'var(--accent-primary)' }}>
              <MessageSquare size={24} />
            </div>
            <h3 style={styles.cardTitle}>WebSocket Chat</h3>
            <p style={styles.cardDesc}>
              Coordinate pickup spots, delayed timings, and luggage capacities instantly using our integrated real-time ride chat room.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-panel glass-panel-hover" style={styles.flashcard}>
            <div style={{ ...styles.cardIconBox, backgroundColor: 'rgba(255, 234, 0, 0.1)', color: 'var(--warning)' }}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={styles.cardTitle}>Reliability Metrics</h3>
            <p style={styles.cardDesc}>
              Build trust in your community. Track user reliability scores based on completed/cancelled rides and rate fellow co-passengers.
            </p>
          </div>
        </div>
      </section>

      {/* How it works details */}
      <section style={styles.detailsSection}>
        <div style={styles.detailsContainer}>
          <div style={styles.detailsImageSide}>
            <div style={styles.infoCardOutline}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Info size={24} color="var(--accent-primary)" />
                <h4>Greener Commutes</h4>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                By sharing rides, commuters collectively reduce carbon emissions, traffic congestion on busy corridors, and daily travel expenses.
              </p>
            </div>
          </div>
          <div style={styles.detailsTextSide}>
            <h2 style={styles.sectionTitle}>Completely Integrated, Simple COMMUTE Flow</h2>
            <div style={styles.stepList}>
              <div style={styles.stepItem}>
                <span style={styles.stepNum}>1</span>
                <div>
                  <strong>Register & Add Vehicle</strong>
                  <p style={styles.stepDesc}>Sign up with email, add your vehicle (car, bike, or auto) under profile with details.</p>
                </div>
              </div>
              <div style={styles.stepItem}>
                <span style={styles.stepNum}>2</span>
                <div>
                  <strong>Offer or Search Rides</strong>
                  <p style={styles.stepDesc}>Publish your schedule or query coordinates on interactive Leaflet maps.</p>
                </div>
              </div>
              <div style={styles.stepItem}>
                <span style={styles.stepNum}>3</span>
                <div>
                  <strong>Chat & Ride Together</strong>
                  <p style={styles.stepDesc}>Request to join, get instant push alerts, chat coordinates, and travel!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.landingFooter}>
        <p>© 2026 CoRide Inc. Crafted for smart community transit.</p>
      </footer>

      {/* ================= MODAL: SIGN IN ================= */}
      {isLoginOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsLoginOpen(false)}>
          <div className="glass-panel animate-slide" style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsLoginOpen(false)} style={styles.closeBtn}>
              <X size={20} />
            </button>
            <h2 style={styles.modalTitle}>Welcome Back</h2>
            <p style={styles.modalSubtitle}>Sign in to coordinate shared daily commute rides</p>

            {isExpired && (
              <div style={styles.infoAlert}>
                <AlertCircle size={18} />
                <span>Session expired. Please log in again.</span>
              </div>
            )}

            {error && (
              <div style={styles.errorAlert}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} style={styles.form}>
              <div className="form-group">
                <label className="form-label" htmlFor="loginEmail">Email Address</label>
                <div style={styles.inputWrapper}>
                  <Mail size={18} style={styles.inputIcon} />
                  <input
                    id="loginEmail"
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="loginPassword">Password</label>
                <div style={styles.inputWrapper}>
                  <Lock size={18} style={styles.inputIcon} />
                  <input
                    id="loginPassword"
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={loading}>
                <LogIn size={18} />
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div style={styles.divider}>
              <span style={styles.dividerLine}></span>
              <span style={styles.dividerText}>or</span>
              <span style={styles.dividerLine}></span>
            </div>

            {/* Google Authentication Simulation */}
            <button onClick={() => setIsGoogleMockOpen(true)} style={styles.googleBtn}>
              <svg style={styles.googleIcon} viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.96-2.87 3.66-4.51 6.76-4.51z"/>
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.91c2.2-2.03 3.67-5.01 3.67-8.64z"/>
                <path fill="#FBBC05" d="M5.24 10.55c-.24-.72-.38-1.5-.38-2.3c0-.8.14-1.57.38-2.3L1.39 2.96C.5 4.77 0 6.8 0 8.95c0 2.15.5 4.18 1.39 5.99l3.85-2.99c-.24-.73-.38-1.51-.38-2.4z"/>
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.76-2.91c-1.1.74-2.5 1.18-4.2 1.18-3.1 0-5.8-1.64-6.76-4.51l-3.85 2.99C3.37 20.33 7.35 23 12 23z"/>
              </svg>
              Continue with Google
            </button>

            <div style={styles.modalFooter}>
              New to CoRide?{' '}
              <button onClick={() => { setIsLoginOpen(false); setIsRegisterOpen(true); }} style={styles.footerLink}>
                Create an account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: SIGN UP ================= */}
      {isRegisterOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsRegisterOpen(false)}>
          <div className="glass-panel animate-slide" style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsRegisterOpen(false)} style={styles.closeBtn}>
              <X size={20} />
            </button>
            <h2 style={styles.modalTitle}>Join CoRide</h2>
            <p style={styles.modalSubtitle}>Register to start sharing rides with other commuters</p>

            {error && (
              <div style={styles.errorAlert}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} style={styles.form}>
              <div className="form-group">
                <label className="form-label" htmlFor="regName">Full Name</label>
                <div style={styles.inputWrapper}>
                  <User size={18} style={styles.inputIcon} />
                  <input
                    id="regName"
                    type="text"
                    className="form-input"
                    placeholder="John Doe"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="regEmail">Email Address</label>
                <div style={styles.inputWrapper}>
                  <Mail size={18} style={styles.inputIcon} />
                  <input
                    id="regEmail"
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="regPassword">Password</label>
                <div style={styles.inputWrapper}>
                  <Lock size={18} style={styles.inputIcon} />
                  <input
                    id="regPassword"
                    type="password"
                    className="form-input"
                    placeholder="•••••••• (Min. 6 chars)"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="regPhoto">Profile Photo URL (Optional)</label>
                <div style={styles.inputWrapper}>
                  <User size={18} style={styles.inputIcon} />
                  <input
                    id="regPhoto"
                    type="url"
                    className="form-input"
                    placeholder="https://example.com/avatar.jpg"
                    value={regPhoto}
                    onChange={(e) => setRegPhoto(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={loading}>
                <UserPlus size={18} />
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>

            <div style={styles.modalFooter}>
              Already have an account?{' '}
              <button onClick={() => { setIsRegisterOpen(false); setIsLoginOpen(true); }} style={styles.footerLink}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: GOOGLE OAUTH SELECTOR ================= */}
      {isGoogleMockOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsGoogleMockOpen(false)}>
          <div className="glass-panel animate-slide" style={styles.googleModalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.googleModalHeader}>
              <svg style={styles.googleModalIcon} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.91c2.2-2.03 3.67-5.01 3.67-8.64z"/>
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.76-2.91c-1.1.74-2.5 1.18-4.2 1.18-3.1 0-5.8-1.64-6.76-4.51l-3.85 2.99C3.37 20.33 7.35 23 12 23z"/>
                <path fill="#FBBC05" d="M5.24 10.55c-.24-.72-.38-1.5-.38-2.3c0-.8.14-1.57.38-2.3L1.39 2.96C.5 4.77 0 6.8 0 8.95c0 2.15.5 4.18 1.39 5.99l3.85-2.99c-.24-.73-.38-1.51-.38-2.4z"/>
                <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.96-2.87 3.66-4.51 6.76-4.51z"/>
              </svg>
              <h3>Sign in with Google</h3>
              <p>Choose an account to continue to CoRide</p>
            </div>

            <div style={styles.googleAccountsList}>
              {systemAccount && (
                <div style={{ ...styles.googleAccountItem, borderBottom: '2px solid rgba(124, 77, 255, 0.2)', backgroundColor: 'rgba(124, 77, 255, 0.05)' }} onClick={() => handleGoogleOAuth(systemAccount.email, systemAccount.name)}>
                  <div style={{ ...styles.googleAvatarFallback, backgroundColor: 'var(--accent-primary)', color: '#fff' }}>
                    {systemAccount.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ color: '#202124' }}>{systemAccount.name}</strong>
                      <span style={{ fontSize: '0.65rem', backgroundColor: '#7c4dff', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>System Account</span>
                    </div>
                    <span style={styles.googleAccountEmail}>{systemAccount.email}</span>
                  </div>
                </div>
              )}
              <div style={styles.googleAccountItem} onClick={() => handleGoogleOAuth('alex.jones@college.edu', 'Alex Jones')}>
                <div style={styles.googleAvatarFallback}>A</div>
                <div>
                  <strong>Alex Jones</strong>
                  <span style={styles.googleAccountEmail}>alex.jones@college.edu</span>
                </div>
              </div>

              <div style={styles.googleAccountItem} onClick={() => handleGoogleOAuth('emily.smith@college.edu', 'Emily Smith')}>
                <div style={styles.googleAvatarFallback}>E</div>
                <div>
                  <strong>Emily Smith</strong>
                  <span style={styles.googleAccountEmail}>emily.smith@college.edu</span>
                </div>
              </div>

              <div style={styles.googleAccountItem} onClick={() => handleGoogleOAuth('campus.user@college.edu', 'Campus User')}>
                <div style={styles.googleAvatarFallback}>C</div>
                <div>
                  <strong>Campus User</strong>
                  <span style={styles.googleAccountEmail}>campus.user@college.edu</span>
                </div>
              </div>
            </div>

            <button onClick={() => setIsGoogleMockOpen(false)} style={styles.googleCancelBtn}>
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

const styles = {
  landingWrapper: {
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: 'var(--bg-primary)',
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'hidden',
  },
  header: {
    height: '75px',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    background: 'var(--glass-bg)',
    backdropFilter: 'var(--glass-blur)',
    zIndex: 100,
  },
  headerContainer: {
    maxWidth: '1200px',
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
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  },
  themeToggle: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color var(--transition-fast)',
    outline: 'none',
  },
  loginBtnHeader: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 600,
    transition: 'color var(--transition-fast)',
  },
  signUpBtnHeader: {
    padding: '0.6rem 1.2rem',
    fontSize: '0.9rem',
  },
  heroSection: {
    padding: '5rem 2rem 4rem 2rem',
    background: 'radial-gradient(circle at 80% 20%, rgba(124, 77, 255, 0.08) 0%, transparent 50%)',
  },
  heroContainer: {
    maxWidth: '800px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  badgePromo: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--accent-primary)',
    background: 'rgba(124, 77, 255, 0.1)',
    padding: '0.4rem 0.8rem',
    borderRadius: 'var(--radius-full)',
    marginBottom: '1.5rem',
    letterSpacing: '0.05em',
  },
  heroTitle: {
    fontSize: '3.25rem',
    fontWeight: 800,
    lineHeight: '1.15',
    letterSpacing: '-0.04em',
    marginBottom: '1.5rem',
  },
  heroText: {
    fontSize: '1.1rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    marginBottom: '2.5rem',
    maxWidth: '600px',
  },
  heroCTA: {
    display: 'flex',
    gap: '1.25rem',
    marginBottom: '3rem',
    justifyContent: 'center',
  },
  ctaPrimary: {
    padding: '0.9rem 2rem',
  },
  ctaSecondary: {
    padding: '0.9rem 2rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2.5rem',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '2rem',
    width: '100%',
    justifyContent: 'center',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statVal: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  statLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginTop: '0.2rem',
  },
  heroVisual: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualCard: {
    width: '100%',
    maxWidth: '380px',
    padding: '2rem',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
  },
  visualHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visualMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem 0',
    borderTop: '1px solid var(--border-color)',
    borderBottom: '1px solid var(--border-color)',
  },
  visualMetaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  flashcardSection: {
    padding: '6rem 2rem',
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '4rem',
  },
  sectionTitle: {
    fontSize: '2rem',
    fontWeight: 700,
  },
  sectionSubtitle: {
    color: 'var(--text-secondary)',
    fontSize: '1rem',
    marginTop: '0.5rem',
  },
  flashcardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1.5rem',
  },
  flashcard: {
    padding: '2rem 1.5rem',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    cursor: 'default',
  },
  cardIconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  cardTitle: {
    fontSize: '1.2rem',
    fontWeight: 600,
    marginBottom: '0.75rem',
  },
  cardDesc: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  detailsSection: {
    padding: '4rem 2rem 6rem 2rem',
    background: 'radial-gradient(circle at 20% 80%, rgba(0, 229, 255, 0.05) 0%, transparent 40%)',
  },
  detailsContainer: {
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1.2fr',
    gap: '5rem',
    alignItems: 'center',
  },
  detailsImageSide: {
    display: 'flex',
    justifyContent: 'center',
  },
  infoCardOutline: {
    border: '2px dashed var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: '2.5rem',
    maxWidth: '360px',
  },
  detailsTextSide: {
    display: 'flex',
    flexDirection: 'column',
  },
  stepList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    marginTop: '2.5rem',
  },
  stepItem: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'flex-start',
  },
  stepNum: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'rgba(124, 77, 255, 0.1)',
    color: 'var(--accent-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    flexShrink: 0,
  },
  stepDesc: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    marginTop: '0.25rem',
  },
  landingFooter: {
    height: '100px',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginTop: 'auto',
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 5, 8, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modalCard: {
    maxWidth: '420px',
    width: '100%',
    padding: '2.5rem',
    position: 'relative',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  closeBtn: {
    position: 'absolute',
    top: '1.25rem',
    right: '1.25rem',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color var(--transition-fast)',
  },
  modalTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    marginBottom: '0.4rem',
  },
  modalSubtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    marginBottom: '2rem',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  submitBtn: {
    width: '100%',
    marginTop: '1.5rem',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '1.5rem 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: 'var(--border-color)',
  },
  dividerText: {
    padding: '0 1rem',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  googleBtn: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    fontWeight: 600,
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)',
  },
  googleIcon: {
    width: '18px',
    height: '18px',
  },
  errorAlert: {
    backgroundColor: 'rgba(255, 23, 68, 0.1)',
    border: '1px solid rgba(255, 23, 68, 0.2)',
    color: 'var(--danger)',
    padding: '0.8rem 1rem',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.85rem',
    marginBottom: '1.5rem',
  },
  infoAlert: {
    backgroundColor: 'rgba(41, 121, 255, 0.1)',
    border: '1px solid rgba(41, 121, 255, 0.2)',
    color: 'var(--info)',
    padding: '0.8rem 1rem',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.85rem',
    marginBottom: '1.5rem',
  },
  modalFooter: {
    marginTop: '2rem',
    textAlign: 'center',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
  },
  footerLink: {
    background: 'none',
    border: 'none',
    color: 'var(--accent-primary)',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    fontSize: '0.875rem',
  },
  // Google mock popup
  googleModalCard: {
    maxWidth: '360px',
    width: '100%',
    padding: '2rem',
    backgroundColor: '#fff',
    color: '#333',
    borderRadius: '8px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
  },
  googleModalHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: '1.5rem',
    gap: '0.5rem',
    '& h3': {
      color: '#202124',
      fontSize: '1.4rem',
      fontWeight: 500,
    },
    '& p': {
      color: '#5f6368',
      fontSize: '0.9rem',
    }
  },
  googleModalIcon: {
    width: '36px',
    height: '36px',
  },
  googleAccountsList: {
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #dadce0',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '1.5rem',
  },
  googleAccountItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    cursor: 'pointer',
    borderBottom: '1px solid #dadce0',
    transition: 'background-color 0.2s',
  },
  googleAvatarFallback: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-primary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.9rem',
  },
  googleAccountEmail: {
    display: 'block',
    fontSize: '0.8rem',
    color: '#5f6368',
    marginTop: '0.1rem',
  },
  googleCancelBtn: {
    padding: '0.6rem 1rem',
    border: 'none',
    background: '#f1f3f4',
    color: '#3c4043',
    fontWeight: 500,
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  }
};

// Add responsive media query overrides
if (typeof window !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    @media (max-width: 900px) {
      div[style*="heroContainer"] { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
      div[style*="heroVisual"] { display: none !important; }
      div[style*="flashcardsGrid"] { grid-template-columns: repeat(2, 1fr) !important; }
      div[style*="detailsContainer"] { grid-template-columns: 1fr !important; gap: 3rem !important; }
    }
    @media (max-width: 600px) {
      div[style*="flashcardsGrid"] { grid-template-columns: 1fr !important; }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default Login;
