import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import authAPI from '../services/authAPI';
import { MapPin, Mail, Lock, LogIn, AlertCircle, Route, ShieldCheck, MessageSquare, IndianRupee, Sun, Moon, X, User, ArrowRight, UserPlus, Info, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RotatingText = ({ words }) => {
  const [displayText, setDisplayText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let timeout;
    const currentWord = words[wordIndex];

    if (isPaused) {
      timeout = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, 2000);
    } else if (isDeleting) {
      if (displayText === '') {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % words.length);
      } else {
        timeout = setTimeout(() => {
          setDisplayText(currentWord.substring(0, displayText.length - 1));
        }, 50);
      }
    } else {
      if (displayText === currentWord) {
        setIsPaused(true);
      } else {
        timeout = setTimeout(() => {
          setDisplayText(currentWord.substring(0, displayText.length + 1));
        }, 100);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, isPaused, wordIndex, words]);

  return (
    <span style={{ 
      position: 'relative', 
      display: 'inline-block', 
      width: '4.8em', 
      textAlign: 'right'
    }}>
      <span style={{ visibility: 'hidden' }}>Commute</span>
      <span style={{ 
        position: 'absolute', 
        right: 0, 
        top: 0, 
        whiteSpace: 'nowrap',
        background: 'var(--accent-gradient)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        {displayText}
      </span>
    </span>
  );
};

const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get('expired');
  const showRegisterOnLoad = searchParams.get('register');

  // Modal triggers
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(showRegisterOnLoad === 'true');

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
  const [isSuccess, setIsSuccess] = useState(false);

  // Theme states
  const [theme, setTheme] = useState(localStorage.getItem('coride_theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  // Scroll reveal observer effect
  useEffect(() => {
    if (isLoginOpen || isRegisterOpen) return; // Only run on landing page

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-active');
        }
      });
    }, { threshold: 0.1 });

    const targets = document.querySelectorAll('.scroll-reveal');
    targets.forEach((el) => observer.observe(el));

    return () => {
      targets.forEach((el) => observer.unobserve(el));
    };
  }, [isLoginOpen, isRegisterOpen]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('coride_theme', nextTheme);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSuccess(false);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      setLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsLoginOpen(false);
        navigate('/dashboard');
        setIsSuccess(false);
      }, 350);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to sign in. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSuccess(false);

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register(regName, regEmail, regPassword, regPhoto || null);
      setLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsRegisterOpen(false);
        navigate('/dashboard');
        setIsSuccess(false);
      }, 350);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Check if email is already in use.');
      setLoading(false);
    }
  };

  const getStatusBgColor = () => {
    if (error) return theme === 'dark' ? '#5c1414' : '#ffd6d6';
    if (isSuccess) return theme === 'dark' ? '#145c22' : '#d6ffd6';
    return 'var(--bg-primary)';
  };

  // Google OAuth handler removed

  if (isLoginOpen) {
    return (
      <div style={{ ...styles.splitWrapper, backgroundColor: getStatusBgColor(), transition: 'background-color 0.5s ease' }} className="animate-fade">
        <div style={styles.splitFormSide}>
          <div style={styles.splitHeader}>
            <button onClick={() => { setError(''); setIsLoginOpen(false); }} style={styles.splitBackBtn}>
              <ArrowLeft size={16} /> Back to Home
            </button>
            <button onClick={toggleTheme} style={styles.splitThemeToggle} title="Toggle Theme">
              {theme === 'dark' ? <Sun size={18} color="var(--warning)" /> : <Moon size={18} color="var(--accent-primary)" />}
            </button>
          </div>
          <div style={styles.splitFormCard} className="animate-slide-left">
            <div style={{ ...styles.logo, marginBottom: '2rem' }}>
              <div style={styles.logoBadge}>
                <Route size={22} style={{ color: 'var(--accent-secondary)' }} />
              </div>
              <span style={styles.logoText}>Co<span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Ride</span></span>
            </div>
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

            <div style={styles.modalFooter}>
              New to CoRide?{' '}
              <button onClick={() => { setError(''); setIsLoginOpen(false); setIsRegisterOpen(true); }} style={styles.footerLink}>
                Create an account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isRegisterOpen) {
    return (
      <div style={{ ...styles.splitWrapper, backgroundColor: getStatusBgColor(), transition: 'background-color 0.5s ease' }} className="animate-fade">
        <div style={styles.splitFormSide}>
          <div style={styles.splitHeader}>
            <button onClick={() => { setError(''); setIsRegisterOpen(false); }} style={styles.splitBackBtn}>
              <ArrowLeft size={16} /> Back to Home
            </button>
            <button onClick={toggleTheme} style={styles.splitThemeToggle} title="Toggle Theme">
              {theme === 'dark' ? <Sun size={18} color="var(--warning)" /> : <Moon size={18} color="var(--accent-primary)" />}
            </button>
          </div>
          <div style={styles.splitFormCard} className="animate-slide-left">
            <div style={{ ...styles.logo, marginBottom: '2rem' }}>
              <div style={styles.logoBadge}>
                <Route size={22} style={{ color: 'var(--accent-secondary)' }} />
              </div>
              <span style={styles.logoText}>Co<span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Ride</span></span>
            </div>
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



              <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={loading}>
                <UserPlus size={18} />
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>

            <div style={styles.modalFooter}>
              Already have an account?{' '}
              <button onClick={() => { setError(''); setIsRegisterOpen(false); setIsLoginOpen(true); }} style={styles.footerLink}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={styles.landingWrapper}>
      {/* Header Bar */}
      <header style={styles.header}>
        <div style={styles.headerContainer}>
          <Link to="/login" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ ...styles.logo, textDecoration: 'none', cursor: 'pointer' }}>
            <div style={styles.logoBadge}>
              <Route size={22} style={{ color: 'var(--accent-secondary)' }} />
            </div>
            <span style={styles.logoText}>Co<span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Ride</span></span>
          </Link>

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
      <section style={styles.heroSection} className="grid-mesh">
        <div style={styles.heroContainer}>
          <div style={styles.heroContent}>
            <div style={styles.badgePromo}>🚀 SMART COMMUNITY RIDE SHARING</div>
            <h1 style={styles.heroTitle}>
              Ride Together<br />
              <span>
                <RotatingText words={['Save', 'Share', 'Commute', 'Connect']} />
                <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> Together</span>
              </span>
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
      <section style={styles.flashcardSection} className="scroll-reveal">
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Commute Smarter with CoRide</h2>
          <p style={styles.sectionSubtitle}>Discover key features tailored for modern ride-sharing operations.</p>
        </div>

        <div style={styles.flashcardsGrid}>
          {/* Card 1 */}
          <div className="glass-panel glass-panel-hover" style={styles.flashcard}>
            <div style={{ ...styles.cardIconBox, backgroundColor: 'rgba(255, 140, 0, 0.1)', color: 'var(--accent-secondary)' }}>
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
            <div style={{ ...styles.cardIconBox, backgroundColor: 'rgba(255, 0, 127, 0.1)', color: 'var(--accent-primary)' }}>
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

        {/* Vehicle Options Grid */}
        <div style={{...styles.vehicleCardsGrid, marginTop: '4rem', padding: '0 2rem'}}>
          {/* Card 1 */}
          <div className="glass-panel glass-panel-hover" style={styles.vehicleCard}>
            <div style={styles.vehicleCardContent}>
              <h3 style={styles.vehicleCardTitle}>Bike-Taxi</h3>
              <p style={styles.vehicleCardDesc}>Beat traffic, ride quicker</p>
            </div>
            <img src="/assets/bike.png" alt="Bike Taxi" style={styles.vehicleImage} />
          </div>
          {/* Card 2 */}
          <div className="glass-panel glass-panel-hover" style={styles.vehicleCard}>
            <div style={styles.vehicleCardContent}>
              <h3 style={styles.vehicleCardTitle}>Auto</h3>
              <p style={styles.vehicleCardDesc}>Everyday autos, made easy</p>
            </div>
            <img src="/assets/auto.png" alt="Auto Rickshaw" style={styles.vehicleImage} />
          </div>
          {/* Card 3 */}
          <div className="glass-panel glass-panel-hover" style={styles.vehicleCard}>
            <div style={styles.vehicleCardContent}>
              <h3 style={styles.vehicleCardTitle}>Cab</h3>
              <p style={styles.vehicleCardDesc}>Comfort for every journey</p>
            </div>
            <img src="/assets/cab.png" alt="Cab Taxi" style={styles.vehicleImage} />
          </div>
        </div>
      </section>

      {/* How it works details */}
      <section style={styles.detailsSection} className="scroll-reveal">
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
    paddingTop: '75px',
  },
  splitWrapper: {
    display: 'flex',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: 'var(--bg-primary)',
    overflow: 'hidden',
  },
  splitFormSide: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '3rem 2rem',
    overflowY: 'auto',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splitHeader: {
    position: 'absolute',
    top: '1.5rem',
    left: '2rem',
    right: '2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitBackBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    borderRadius: 'var(--radius-sm)',
    transition: 'color var(--transition-fast), transform var(--transition-fast)',
  },
  splitThemeToggle: {
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
  splitFormCard: {
    maxWidth: '420px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    marginTop: '2rem',
  },
  splitVisualSide: {
    flex: 1.1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem',
    overflow: 'hidden',
  },
  splitVisualOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, rgba(255, 0, 127, 0.2) 0%, rgba(255, 140, 0, 0.15) 100%)',
    zIndex: 1,
  },
  splitVisualImg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: 0.9,
    filter: 'brightness(0.75)',
  },
  splitVisualContent: {
    position: 'relative',
    zIndex: 2,
    maxWidth: '460px',
    borderRadius: 'var(--radius-lg)',
    padding: '2rem 2.5rem',
  },
  visualTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.75rem',
    fontWeight: 700,
    marginBottom: '0.75rem',
    background: 'var(--accent-gradient)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  visualText: {
    fontSize: '0.95rem',
    lineHeight: '1.6',
    color: 'var(--text-secondary)',
  },
  header: {
    height: '75px',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    background: 'var(--bg-secondary)',
    zIndex: 1000,
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
    background: 'linear-gradient(135deg, rgba(255, 0, 127, 0.12) 0%, rgba(255, 140, 0, 0.12) 100%)',
    backdropFilter: 'var(--glass-blur)',
    border: '1px solid rgba(255, 0, 127, 0.2)',
    boxShadow: '0 0 10px rgba(255, 0, 127, 0.15)',
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
    background: 'radial-gradient(circle at 80% 20%, rgba(255, 0, 127, 0.08) 0%, transparent 50%)',
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
    background: 'rgba(255, 0, 127, 0.1)',
    border: '1px solid rgba(255, 0, 127, 0.25)',
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
  vehicleCardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2rem',
    width: '100%',
    maxWidth: '1200px',
  },
  vehicleCard: {
    padding: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vehicleCardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  vehicleCardTitle: {
    fontSize: '1.4rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  },
  vehicleCardDesc: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    margin: 0,
  },
  vehicleImage: {
    width: '80px',
    height: '80px',
    objectFit: 'contain',
    filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.15))',
  },
  detailsSection: {
    padding: '4rem 2rem 6rem 2rem',
    background: 'radial-gradient(circle at 20% 80%, rgba(255, 140, 0, 0.05) 0%, transparent 40%)',
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
    backgroundColor: 'rgba(255, 0, 127, 0.1)',
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
    background: 'var(--bg-secondary)',
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
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '2.5rem',
    position: 'relative',
    border: '1px solid var(--glass-border)',
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
      div[style*="splitVisualSide"] { display: none !important; }
      div[style*="splitFormSide"] { width: 100% !important; flex: none !important; }
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
