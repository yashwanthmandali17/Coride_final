import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import rideAPI from '../services/rideAPI';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { User, ShieldCheck, Star, CreditCard, Car, CheckCircle, ShieldAlert } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { addToast } = useNotifications();
  
  // Profile update state
  const [name, setName] = useState(user?.name || '');
  const [profilePhoto, setProfilePhoto] = useState(user?.profile_photo || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);

  // Sync state with user context updates
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setProfilePhoto(user.profile_photo || '');
      loadVehicles();
    }
  }, [user]);

  const loadVehicles = async () => {
    try {
      const data = await rideAPI.getVehicles();
      setVehicles(data);
    } catch (err) {
      console.error("Failed to load vehicles in profile:", err);
    }
  };

  const getDlExpiryStatusBadge = (expiryDateStr) => {
    if (!expiryDateStr) {
      return <span style={{ ...styles.badge, ...styles.badgeMissing }}>Not Uploaded</span>;
    }
    const expiryDate = new Date(expiryDateStr);
    const today = new Date();
    expiryDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span style={{ ...styles.badge, ...styles.badgeExpired }}>Expired</span>;
    } else if (diffDays <= 7) {
      return <span style={{ ...styles.badge, ...styles.badgeWarning }}>Expires in {diffDays} day{diffDays > 1 ? 's' : ''}</span>;
    } else {
      return <span style={{ ...styles.badge, ...styles.badgeValid }}>Valid</span>;
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setProfileLoading(true);

    try {
      await updateProfile(name, profilePhoto || null);
      setProfileSuccess('Profile updated successfully!');
      addToast('Success', 'Profile updated successfully!', 'success');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err) {
      setProfileError('Failed to update profile. Please try again.');
      addToast('Error', 'Failed to update profile.', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div style={styles.container} className="animate-fade">
      <div style={styles.heroSection}>
        <h2 style={styles.heroTitle}>Profile Management</h2>
        <p style={styles.heroSubtitle}>
          Manage your personal details, verify passenger metrics, and access your digital wallet or registered vehicles.
        </p>
      </div>

      <div style={styles.grid} className="profile-grid">
        
        {/* Left Column: Personal info edit */}
        <div style={styles.leftCol}>
          <div className="glass-panel" style={styles.panel}>
            <h3 style={styles.panelTitle}>
              <User size={18} color="var(--accent-primary)" /> Profile Information
            </h3>

            <div style={styles.metricsBox}>
              <div className="tooltip-container" style={styles.metricItem}>
                <ShieldCheck size={20} color="var(--accent-secondary)" />
                <div>
                  <span style={styles.metricLabel}>Reliability Score</span>
                  <span style={styles.metricVal}>{user?.reliability_score?.toFixed(0) || 100}%</span>
                </div>
                <span className="tooltip-text" style={{ top: '105%' }}>
                  Your commitment rating: completing published rides increases it, while cancelling scheduled rides reduces it.
                </span>
              </div>
              <div style={styles.metricItem}>
                <Star size={20} fill="var(--warning)" color="var(--warning)" />
                <div>
                  <span style={styles.metricLabel}>Average Rating</span>
                  <span style={styles.metricVal}>
                    {user?.average_rating > 0 ? `${user.average_rating.toFixed(1)} / 5` : 'No reviews'}
                  </span>
                </div>
              </div>
            </div>

            {profileSuccess && (
              <div style={styles.successAlert}>
                <CheckCircle size={16} />
                <span>{profileSuccess}</span>
              </div>
            )}
            {profileError && (
              <div style={styles.errorAlert}>
                <ShieldAlert size={16} />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label className="form-label" htmlFor="pname">Display Name</label>
                <input
                  id="pname"
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Cannot change)</label>
                <input
                  type="email"
                  className="form-input"
                  value={user?.email || ''}
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pphoto">Profile Photo URL</label>
                <input
                  id="pphoto"
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/photo.jpg"
                  value={profilePhoto}
                  onChange={(e) => setProfilePhoto(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={profileLoading}>
                {profileLoading ? 'Updating Profile...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Wallet & Vehicles Hub Cards */}
        <div style={styles.rightCol}>
          {/* Card 1: Digital Wallet */}
          <div className="glass-panel" style={{ ...styles.panel, marginBottom: '2rem' }}>
            <h3 style={styles.panelTitle}>
              <CreditCard size={18} color="var(--accent-secondary)" /> Digital Wallet
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Securely store and manage your Driving License documents for fast verification at police checkposts. Stored privately and visible only to you.
            </p>
            
            <div style={styles.hubStatusBox}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>License Status:</span>
              {getDlExpiryStatusBadge(user?.driving_license_expiry)}
            </div>

            <Link to="/wallet" className="btn btn-secondary" style={{ width: '100%', display: 'block', textDecoration: 'none', textAlign: 'center', fontWeight: 600 }}>
              Go to Digital Wallet
            </Link>
          </div>

          {/* Card 2: Registered Vehicles */}
          <div className="glass-panel" style={styles.panel}>
            <h3 style={styles.panelTitle}>
              <Car size={18} color="var(--accent-primary)" /> Registered Vehicles
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Add and manage your cars, bikes, or autos. Upload Registration Certificates (RC) to ensure seamless passenger bookings and checkpoint clearance.
            </p>
            
            <div style={styles.hubStatusBox}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Registered Vehicles:</span>
              <span style={{ 
                fontSize: '0.8rem', 
                fontWeight: 600, 
                padding: '0.25rem 0.75rem', 
                borderRadius: '12px', 
                backgroundColor: 'rgba(255, 0, 127, 0.1)', 
                color: 'var(--accent-primary)',
                border: '1px solid rgba(255, 0, 127, 0.2)'
              }}>
                {vehicles.length} Vehicle{vehicles.length !== 1 ? 's' : ''}
              </span>
            </div>

            <Link to="/vehicles" className="btn btn-secondary" style={{ width: '100%', display: 'block', textDecoration: 'none', textAlign: 'center', fontWeight: 600 }}>
              Manage Vehicles
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

const styles = {
  container: {
    paddingTop: '20px',
  },
  heroSection: {
    marginBottom: '2rem',
  },
  heroTitle: {
    fontSize: '2rem',
    fontWeight: 700,
    background: 'var(--accent-gradient)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSubtitle: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    marginTop: '0.4rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.1fr',
    gap: '2rem',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  panel: {
    padding: '2rem',
  },
  panelTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: '1.5rem',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '0.5rem',
    fontFamily: 'var(--font-heading)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  metricsBox: {
    display: 'flex',
    gap: '1.5rem',
    marginBottom: '2rem',
    backgroundColor: 'var(--card-inner-bg)',
    padding: '1rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
  },
  metricItem: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  metricLabel: {
    display: 'block',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  metricVal: {
    display: 'block',
    fontSize: '1.2rem',
    fontWeight: 700,
    fontFamily: 'var(--font-heading)',
    marginTop: '0.1rem',
  },
  hubStatusBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--card-inner-bg)',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--card-inner-border)',
    marginBottom: '1.5rem',
  },
  badge: {
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    display: 'inline-block',
  },
  badgeMissing: {
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)',
  },
  badgeExpired: {
    backgroundColor: 'rgba(255, 23, 68, 0.15)',
    color: 'var(--danger)',
    border: '1px solid rgba(255, 23, 68, 0.3)',
  },
  badgeWarning: {
    backgroundColor: 'rgba(255, 140, 0, 0.15)',
    color: 'var(--warning)',
    border: '1px solid rgba(255, 140, 0, 0.3)',
  },
  badgeValid: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    color: 'var(--success)',
    border: '1px solid rgba(0, 230, 118, 0.3)',
  },
  successAlert: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    border: '1px solid rgba(0, 230, 118, 0.2)',
    color: 'var(--success)',
    padding: '0.8rem 1rem',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.85rem',
    marginBottom: '1.5rem',
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
};

// Add responsive layout styles
if (typeof window !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    @media (max-width: 900px) {
      .profile-grid { grid-template-columns: 1fr !important; }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default Profile;
