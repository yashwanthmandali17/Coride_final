import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import rideAPI from '../services/rideAPI';
import { useAuth } from '../contexts/AuthContext';
import { History, MapPin, Calendar, IndianRupee, ExternalLink, ShieldCheck } from 'lucide-react';
import LoadingFacts from '../components/LoadingFacts';

const RideHistory = () => {
  const { user } = useAuth();
  
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'driver' | 'passenger'

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setError('');
        // Fetch all user's requests/bookings
        const bookings = await rideAPI.getMyRequests();
        const passengerHistory = bookings
          .filter(b => b.status === 'accepted' && (b.ride.status === 'completed' || b.ride.status === 'cancelled' || b.ride.status === 'abandoned'))
          .map(b => ({
            id: b.id,
            rideId: b.ride.id,
            source: b.ride.source,
            destination: b.ride.destination,
            departureTime: b.ride.departure_time,
            cost: b.ride.final_cost,
            status: b.ride.status,
            role: 'passenger',
            partnerName: b.ride.owner.name
          }));

        // Fetch driver history (user's published rides that are completed/cancelled/abandoned)
        const allRides = await rideAPI.getMyRides();
        const driverHistory = allRides
          .filter(r => r.owner_id === user.id && (r.status === 'completed' || r.status === 'cancelled' || r.status === 'abandoned'))
          .map(r => ({
            id: r.id,
            rideId: r.id,
            source: r.source,
            destination: r.destination,
            departureTime: r.departure_time,
            cost: r.final_cost,
            status: r.status,
            role: 'driver',
            partnerName: 'Multiple passengers'
          }));

        // Combine and sort by departure time (descending)
        const combined = [...passengerHistory, ...driverHistory].sort(
          (a, b) => new Date(b.departureTime) - new Date(a.departureTime)
        );

        setHistoryItems(combined);
      } catch (err) {
        setError('Failed to load ride history.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadHistory();
    }
  }, [user]);

  const filteredItems = historyItems.filter((item) => {
    if (activeTab === 'all') return true;
    return item.role === activeTab;
  });

  if (loading) {
    return <LoadingFacts fullPage={false} />;
  }

  return (
    <div style={styles.container} className="animate-fade">
      <div style={styles.heroSection}>
        <h2 style={styles.heroTitle}>Ride History</h2>
        <p style={styles.heroSubtitle}>
          Review your past shared rides, download history audits, and submit ratings for completed routes.
        </p>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            ...styles.tab,
            borderColor: activeTab === 'all' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'all' ? 'var(--accent-primary)' : 'var(--text-secondary)',
          }}
        >
          All Rides ({historyItems.length})
        </button>
        <button
          onClick={() => setActiveTab('driver')}
          style={{
            ...styles.tab,
            borderColor: activeTab === 'driver' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'driver' ? 'var(--accent-primary)' : 'var(--text-secondary)',
          }}
        >
          As Driver ({historyItems.filter(i => i.role === 'driver').length})
        </button>
        <button
          onClick={() => setActiveTab('passenger')}
          style={{
            ...styles.tab,
            borderColor: activeTab === 'passenger' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'passenger' ? 'var(--accent-primary)' : 'var(--text-secondary)',
          }}
        >
          As Passenger ({historyItems.filter(i => i.role === 'passenger').length})
        </button>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <span>{error}</span>
        </div>
      )}

      {/* List items */}
      {filteredItems.length === 0 ? (
        <div key={activeTab} className="glass-panel animate-fade" style={styles.emptyCard}>
          <History size={36} color="var(--text-muted)" />
          <h4 style={{ marginTop: '1rem' }}>No history records found</h4>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem', fontSize: '0.9rem' }}>
            When you complete or cancel shared rides, they will appear in this log archive.
          </p>
        </div>
      ) : (
        <div key={activeTab} style={styles.list} className="animate-fade">
          {filteredItems.map((item) => (
            <div key={item.id} className="glass-panel animate-slide history-list-item" style={styles.listItem}>
              <div style={styles.mainInfo}>
                <div style={styles.route}>
                  <MapPin size={16} color={item.role === 'driver' ? 'var(--accent-primary)' : 'var(--accent-secondary)'} />
                  <strong>{item.source} to {item.destination}</strong>
                </div>
                <div style={styles.meta} className="history-meta">
                  <div style={styles.metaItem}>
                    <Calendar size={14} />
                    <span>{new Date(item.departureTime).toLocaleDateString()}</span>
                  </div>
                  <div style={styles.metaItem}>
                    <IndianRupee size={14} />
                    <span>Cost Shared: ₹{item.cost}</span>
                  </div>
                  <div style={styles.metaItem}>
                    <ShieldCheck size={14} />
                    <span style={{ textTransform: 'capitalize' }}>Role: {item.role}</span>
                  </div>
                </div>
              </div>

              <div style={styles.sideInfo} className="history-side-info">
                <span className={`badge badge-${item.status}`} style={{ alignSelf: 'flex-end' }}>
                  {item.status}
                </span>
                <Link to={`/rides/${item.rideId}`} className="btn btn-secondary history-details-btn" style={styles.detailsBtn}>
                  <ExternalLink size={14} /> View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    paddingTop: '20px',
    maxWidth: '950px',
    margin: '0 auto',
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
  tabsContainer: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '0.25rem',
  },
  tab: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    padding: '0.5rem 1rem',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
  },
  mainInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    flex: 1,
  },
  route: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1rem',
  },
  meta: {
    display: 'flex',
    gap: '1.5rem',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  sideInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    alignItems: 'flex-end',
  },
  detailsBtn: {
    padding: '0.5rem 1rem',
    fontSize: '0.85rem',
  },
  emptyCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    textAlign: 'center',
  },
  loaderContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10rem 0',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid var(--bg-tertiary)',
    borderTopColor: 'var(--accent-primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorAlert: {
    backgroundColor: 'rgba(255, 23, 68, 0.1)',
    border: '1px solid rgba(255, 23, 68, 0.2)',
    color: 'var(--danger)',
    padding: '0.8rem 1rem',
    borderRadius: 'var(--radius-md)',
    marginBottom: '1.5rem',
  },
};

// Add responsive layout styles
if (typeof window !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    @media (max-width: 768px) {
      .history-list-item { flex-direction: column !important; align-items: flex-start !important; gap: 1rem !important; }
      .history-meta { flex-direction: column !important; gap: 0.5rem !important; }
      .history-side-info { width: 100% !important; align-items: flex-start !important; }
      .history-details-btn { width: 100% !important; text-align: center !important; }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default RideHistory;
