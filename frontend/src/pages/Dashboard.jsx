import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import rideAPI from '../services/rideAPI';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Users, MapPin, Check, X, ShieldAlert, Star, ShieldCheck, MessageSquare, ExternalLink } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  
  const [publishedRides, setPublishedRides] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    try {
      setError('');
      
      // Fetch user's published rides, bookings, and incoming requests in parallel
      const [myPublished, myBookings, incoming] = await Promise.all([
        rideAPI.getMyRides(),
        rideAPI.getMyRequests(),
        rideAPI.getIncomingRequests()
      ]);

      setPublishedRides(myPublished);
      setBookings(myBookings);
      setIncomingRequests(incoming.filter(req => req.status === 'pending'));
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const handleRequestAction = async (requestId, status) => {
    try {
      await rideAPI.updateRequestStatus(requestId, status);
      // Reload dashboard stats
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update request.');
    }
  };

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.spinner} />
      </div>
    );
  }

  return (
    <div style={styles.container} className="animate-fade">
      {/* Stats Widgets Header */}
      <div style={styles.statsHeader} className="glass-panel">
        <div style={styles.welcomeBox}>
          <h2>Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {user.name}!</p>
        </div>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Reliability Score</span>
            <div style={styles.statValue}>
              <ShieldCheck size={24} color="var(--accent-secondary)" />
              <span>{user.reliability_score.toFixed(0)}%</span>
            </div>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Average Rating</span>
            <div style={styles.statValue}>
              <Star size={24} fill="var(--warning)" color="var(--warning)" />
              <span>{user.average_rating > 0 ? user.average_rating.toFixed(1) : "N/A"}</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Grid Layout */}
      <div style={styles.dashboardGrid}>
        
        {/* Left/Main Column: Active Rides & Bookings */}
        <div style={styles.mainCol}>
          {/* Section 1: Incoming pending passenger bookings */}
          {incomingRequests.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={styles.sectionTitle}>Incoming Booking Requests ({incomingRequests.length})</h3>
              <div style={styles.incomingList}>
                {incomingRequests.map((req) => (
                  <div key={req.id} className="glass-panel animate-slide" style={styles.requestCard}>
                    <div style={styles.reqHeader}>
                      <div style={styles.passengerInfo}>
                        {req.passenger.profile_photo ? (
                          <img src={req.passenger.profile_photo} alt={req.passenger.name} style={styles.reqAvatar} />
                        ) : (
                          <div style={styles.reqAvatarFallback}>{req.passenger.name.charAt(0).toUpperCase()}</div>
                        )}
                        <div>
                          <span style={styles.passengerName}>{req.passenger.name}</span>
                          <div style={styles.passengerRating}>
                            <Star size={12} fill="var(--warning)" color="var(--warning)" />
                            <span>{req.passenger.average_rating > 0 ? req.passenger.average_rating.toFixed(1) : "N/A"}</span>
                            <span style={{ color: 'var(--text-muted)' }}>|</span>
                            <span>{req.passenger.reliability_score.toFixed(0)}% Rel</span>
                          </div>
                        </div>
                      </div>
                      <div style={styles.reqActions}>
                        <button
                          onClick={() => handleRequestAction(req.id, 'accepted')}
                          style={styles.acceptBtn}
                          className="btn"
                          title="Accept Passenger"
                        >
                          <Check size={16} /> Accept
                        </button>
                        <button
                          onClick={() => handleRequestAction(req.id, 'rejected')}
                          style={styles.rejectBtn}
                          className="btn"
                          title="Reject Passenger"
                        >
                          <X size={16} /> Reject
                        </button>
                      </div>
                    </div>
                    <div style={styles.reqRoute}>
                      <div style={styles.routeLabel}>Ride to: <strong>{req.ride.destination}</strong></div>
                      <div style={styles.routeTime}>
                        Scheduled: {new Date(req.ride.departure_time).toLocaleDateString()} at{' '}
                        {new Date(req.ride.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: My Published Rides */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={styles.sectionTitle}>My Published Rides (As Driver)</h3>
            {publishedRides.length === 0 ? (
              <div className="glass-panel" style={styles.emptyCard}>
                <p style={{ color: 'var(--text-secondary)' }}>You haven't published any ride offers yet.</p>
                <Link to="/publish" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                  Offer a Ride
                </Link>
              </div>
            ) : (
              <div style={styles.ridesList}>
                {publishedRides.map((ride) => (
                  <div key={ride.id} className="glass-panel" style={styles.rideListItem}>
                    <div style={styles.rideListInfo}>
                      <div style={styles.rideListRoute}>
                        <MapPin size={16} color="var(--accent-secondary)" />
                        <span style={styles.routeText}>{ride.source} → {ride.destination}</span>
                      </div>
                      <div style={styles.rideListMeta}>
                        <span>Date: {new Date(ride.departure_time).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Seats left: {ride.seats_available}</span>
                        <span>•</span>
                        <span className={`badge badge-${ride.status}`}>{ride.status}</span>
                      </div>
                    </div>
                    <div style={styles.rideListActions}>
                      <Link to={`/rides/${ride.id}`} className="btn btn-secondary" style={styles.actionLink}>
                        <ExternalLink size={14} /> Details
                      </Link>
                      {ride.status === 'published' && (
                        <Link to={`/chat/${ride.id}`} className="btn btn-primary" style={styles.actionLink}>
                          <MessageSquare size={14} /> Chat
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Bookings Status Feed */}
        <div style={styles.sidebarCol}>
          <h3 style={styles.sectionTitle}>My Bookings (As Passenger)</h3>
          {bookings.length === 0 ? (
            <div className="glass-panel" style={styles.emptyCard}>
              <p style={{ color: 'var(--text-secondary)' }}>No active bookings requested.</p>
              <Link to="/" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                Search for Rides
              </Link>
            </div>
          ) : (
            <div style={styles.bookingsList}>
              {bookings.map((booking) => (
                <div key={booking.id} className="glass-panel" style={styles.bookingCard}>
                  <div style={styles.bookingHeader}>
                    <div style={styles.driverSection}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Driver</span>
                      <strong style={{ display: 'block', fontSize: '0.95rem' }}>{booking.ride.owner.name}</strong>
                    </div>
                    <span className={`badge badge-${booking.status}`}>{booking.status}</span>
                  </div>
                  <div style={styles.bookingRoute}>
                    <span style={styles.sidebarRouteText}>{booking.ride.source} → {booking.ride.destination}</span>
                  </div>
                  <div style={styles.bookingMeta}>
                    <span>Departs: {new Date(booking.ride.departure_time).toLocaleDateString()}</span>
                    <span>Cost: ₹{booking.ride.final_cost}</span>
                  </div>
                  <div style={styles.bookingFooter}>
                    <Link to={`/rides/${booking.ride.id}`} style={styles.bookingLink}>
                      View details
                    </Link>
                    {booking.status === 'accepted' && booking.ride.status === 'published' && (
                      <Link to={`/chat/${booking.ride.id}`} className="btn btn-primary" style={styles.sidebarChatBtn}>
                        <MessageSquare size={14} /> Open Chat
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

const styles = {
  container: {
    paddingTop: '20px',
  },
  statsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    marginBottom: '2rem',
  },
  welcomeBox: {
    flex: 1,
  },
  statsGrid: {
    display: 'flex',
    gap: '2rem',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  statLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    fontWeight: 600,
    marginBottom: '0.2rem',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    fontFamily: 'var(--font-heading)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: '2.5rem',
  },
  mainCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: '1rem',
    fontFamily: 'var(--font-heading)',
  },
  incomingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  requestCard: {
    padding: '1.25rem',
  },
  reqHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '0.75rem',
    marginBottom: '0.75rem',
  },
  passengerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  reqAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  reqAvatarFallback: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    color: 'var(--accent-primary)',
  },
  passengerName: {
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  passengerRating: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '0.1rem',
  },
  reqActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  acceptBtn: {
    padding: '0.4rem 0.8rem',
    fontSize: '0.8rem',
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    color: 'var(--success)',
    border: '1px solid rgba(0, 230, 118, 0.3)',
  },
  rejectBtn: {
    padding: '0.4rem 0.8rem',
    fontSize: '0.8rem',
    backgroundColor: 'rgba(255, 23, 68, 0.15)',
    color: 'var(--danger)',
    border: '1px solid rgba(255, 23, 68, 0.3)',
  },
  reqRoute: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  routeTime: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  ridesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  rideListItem: {
    padding: '1.25rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rideListInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    flex: 1,
  },
  rideListRoute: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontWeight: 600,
    fontSize: '0.95rem',
  },
  routeText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '450px',
  },
  rideListMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  rideListActions: {
    display: 'flex',
    gap: '0.75rem',
  },
  actionLink: {
    padding: '0.5rem 0.9rem',
    fontSize: '0.85rem',
  },
  sidebarCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  bookingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  bookingCard: {
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  bookingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  driverSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  bookingRoute: {
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  sidebarRouteText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  bookingMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: '0.5rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
  },
  bookingFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.25rem',
  },
  bookingLink: {
    fontSize: '0.85rem',
    color: 'var(--accent-primary)',
    fontWeight: 600,
  },
  sidebarChatBtn: {
    padding: '0.4rem 0.8rem',
    fontSize: '0.8rem',
  },
  emptyCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2.5rem',
    textAlign: 'center',
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
};

// Add responsive stylesheet overrides
if (typeof window !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    @media (max-width: 900px) {
      div[style*="statsHeader"] { flex-direction: column !important; gap: 1rem !important; align-items: flex-start !important; }
      div[style*="statsGrid"] { width: 100% !important; justify-content: space-between !important; }
      div[style*="dashboardGrid"] { grid-template-columns: 1fr !important; }
      span[style*="routeText"] { max-width: 100% !important; }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default Dashboard;
