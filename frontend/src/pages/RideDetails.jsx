import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import rideAPI from '../services/rideAPI';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import RouteMap from '../components/RouteMap';
import LoadingFacts from '../components/LoadingFacts';
import ConfirmModal from '../components/ConfirmModal';
import { MapPin, Calendar, Users, IndianRupee, MessageSquare, ShieldCheck, CheckCircle2, Star, Award, ChevronRight, Check } from 'lucide-react';

const RideDetails = () => {
  const { rideId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = location.state?.searchParams;
  const { addToast } = useNotifications();

  const [ride, setRide] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [myRequest, setMyRequest] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [history, setHistory] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Rating form state
  const [ratingTargetId, setRatingTargetId] = useState('');
  const [ratingTargetName, setRatingTargetName] = useState('');
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [ratingSuccess, setRatingSuccess] = useState('');
  const [ratedUsers, setRatedUsers] = useState({}); // Keep track of who we rated in this session

  const loadRideDetails = async () => {
    try {
      setError('');
      // Fetch ride
      const data = await rideAPI.getRideDetails(rideId);
      setRide(data);

      // Check if user is participant (driver or confirmed passenger)
      const myId = user.id;
      const isPart = data.owner_id === myId;
      
      // If user is request passenger, check request status
      const requests = await rideAPI.getMyRequests();
      const req = requests.find(r => r.ride_id === rideId && r.status !== 'cancelled');
      setMyRequest(req);

      // Check if confirmed participant to fetch participants, history
      if (isPart || (req && req.status === 'accepted')) {
        const parts = await rideAPI.getRideParticipants(rideId);
        setParticipants(parts);
        
        const hist = await rideAPI.getRideHistory(rideId);
        setHistory(hist);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load ride details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && rideId) {
      loadRideDetails();
    }
  }, [user, rideId]);

  const handleRequestJoin = async () => {
    try {
      setLoading(true);
      const payload = {};
      if (searchParams) {
        payload.pickup_location = searchParams.pickup;
        payload.dropoff_location = searchParams.dropoff;
      }
      await rideAPI.requestRide(rideId, payload);
      addToast('Request Sent', 'Your request to join this ride has been submitted.', 'success');
      await loadRideDetails();
    } catch (err) {
      addToast('Error', err.response?.data?.detail || 'Failed to send request.', 'error');
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!myRequest) return;
    try {
      setLoading(true);
      await rideAPI.updateRequestStatus(myRequest.id, 'cancelled');
      addToast('Request Cancelled', 'Your request to join this ride has been cancelled.', 'info');
      await loadRideDetails();
    } catch (err) {
      addToast('Error', err.response?.data?.detail || 'Failed to cancel request.', 'error');
      setLoading(false);
    }
  };

  const handleStartRide = async () => {
    try {
      setLoading(true);
      await rideAPI.updateRideStatus(rideId, 'started');
      addToast('Ride Started', 'The ride has officially started!', 'success');
      await loadRideDetails();
    } catch (err) {
      addToast('Error', err.response?.data?.detail || 'Failed to start ride.', 'error');
      setLoading(false);
    }
  };

  const handleCancelRide = () => {
    setShowCancelModal(true);
  };

  const confirmCancelRide = async () => {
    setShowCancelModal(false);
    try {
      setLoading(true);
      await rideAPI.updateRideStatus(rideId, 'cancelled');
      addToast('Ride Cancelled', 'The ride has been cancelled.', 'info');
      await loadRideDetails();
    } catch (err) {
      addToast('Error', err.response?.data?.detail || 'Failed to cancel ride.', 'error');
      setLoading(false);
    }
  };

  const handleConfirmCompletion = async () => {
    try {
      setLoading(true);
      const res = await rideAPI.confirmCompletion(rideId);
      addToast('Status Update', res.detail + (res.ride_status === 'completed' ? ' Ride is now fully completed!' : ''), 'info');
      await loadRideDetails();
    } catch (err) {
      addToast('Error', err.response?.data?.detail || 'Failed to confirm completion.', 'error');
      setLoading(false);
    }
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    try {
      await rideAPI.submitRating({
        ride_id: rideId,
        reviewee_id: ratingTargetId,
        stars: stars,
        comment: comment
      });
      setRatingSuccess(`Successfully rated ${ratingTargetName}!`);
      addToast('Success', `Successfully rated ${ratingTargetName}!`, 'success');
      setRatedUsers(prev => ({ ...prev, [ratingTargetId]: true }));
      setRatingTargetId('');
      setComment('');
      setStars(5);
      
      // Reload stats
      loadRideDetails();
      setTimeout(() => setRatingSuccess(''), 3000);
    } catch (err) {
      addToast('Error', err.response?.data?.detail || 'Failed to submit rating.', 'error');
    }
  };

  if (loading && !ride) {
    return <LoadingFacts fullPage={false} />;
  }

  if (error || !ride) {
    return (
      <div className="glass-panel" style={styles.errorBox}>
        <h3>Error loading ride</h3>
        <p style={{ color: 'var(--text-secondary)' }}>{error || 'Ride not found.'}</p>
        <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Search
        </button>
      </div>
    );
  }

  const isDriver = ride.owner_id === user.id;
  const isPassenger = participants.some(p => p.user_id === user.id && p.role === 'passenger');
  const isConfirmedParticipant = isDriver || isPassenger;
  
  // Find current user's participant confirmation status
  const myParticipantRow = participants.find(p => p.user_id === user.id);
  const myCompletionConfirmed = myParticipantRow ? myParticipantRow.confirmed_completion : false;

  return (
    <div style={styles.container} className="animate-fade">
      
      <ConfirmModal
        isOpen={showCancelModal}
        title="Cancel Ride"
        message="Are you sure you want to cancel this ride? If passengers are already booked, this will lower your Reliability Score."
        confirmText="Yes, Cancel Ride"
        type="danger"
        onConfirm={confirmCancelRide}
        onCancel={() => setShowCancelModal(false)}
      />

      {/* Header details */}
      <div style={styles.header}>
        <div>
          <span className={`badge badge-${ride.status}`} style={{ marginBottom: '0.5rem' }}>
            Ride Status: {ride.status}
          </span>
          <h2 style={styles.title}>{ride.source.split(',')[0]} to {ride.destination.split(',')[0]}</h2>
          <p style={styles.subtitle}>
            Scheduled: {new Date(ride.departure_time).toLocaleDateString()} at{' '}
            {new Date(ride.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        
        {/* Cost display */}
        <div style={styles.costBox}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Price / Seat</span>
          <div style={styles.costAmount}>
            <IndianRupee size={20} color="var(--success)" />
            <span>{ride.final_cost}</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={styles.grid}>
        
        {/* Left Side: Map and Info Card */}
        <div style={styles.leftCol}>
          {/* Route Map */}
          <div style={styles.mapWrapper}>
            <RouteMap
              mode="view"
              sourceLat={ride.source_lat}
              sourceLng={ride.source_lng}
              destinationLat={ride.destination_lat}
              destinationLng={ride.destination_lng}
              height="280px"
            />
          </div>

          {/* Ride Details Panel */}
          <div className="glass-panel" style={styles.detailsPanel}>
            <h3 style={styles.panelTitle}>Ride Details</h3>
            
            {/* Route Timeline */}
            <div style={styles.routeSection}>
              <div style={styles.routePoint}>
                <div style={styles.routeIconWrapper}>
                  <MapPin size={18} color="#00e676" />
                </div>
                <div style={styles.routeTextContainer}>
                  <span style={styles.routeLabel}>Pick-up Location</span>
                  <p style={styles.routeAddress}>{ride.source}</p>
                </div>
              </div>
              <div style={styles.routeConnector} />
              <div style={styles.routePoint}>
                <div style={styles.routeIconWrapper}>
                  <MapPin size={18} color="#ff1744" />
                </div>
                <div style={styles.routeTextContainer}>
                  <span style={styles.routeLabel}>Drop-off Location</span>
                  <p style={styles.routeAddress}>{ride.destination}</p>
                </div>
              </div>
            </div>
            
            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <Award size={18} color="var(--accent-primary)" />
                <div>
                  <strong>Vehicle Selected</strong>
                  <span style={styles.detailValue}>
                    {ride.vehicle.brand} {ride.vehicle.model} ({ride.vehicle.type}) - {ride.vehicle.registration_number}
                  </span>
                </div>
              </div>
              <div style={styles.detailItem}>
                <Users size={18} color="var(--accent-primary)" />
                <div>
                  <strong>Available Seats</strong>
                  <span style={styles.detailValue}>
                    {ride.seats_available} seats remaining
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Panel */}
            <div style={styles.actionsBox}>
              
              {/* IF DRIVER ACTIONS */}
              {isDriver && (
                <div style={styles.actionRow}>
                  {ride.status === 'published' && (
                    <>
                      <button onClick={handleStartRide} className="btn btn-success" style={{ flex: 1 }}>
                        <CheckCircle2 size={16} /> Start Ride
                      </button>
                      <button onClick={handleCancelRide} className="btn btn-danger">
                        Cancel Ride
                      </button>
                    </>
                  )}
                  {ride.status === 'started' && (
                    <>
                      <Link to={`/chat/${ride.id}`} className="btn btn-primary" style={{ flex: 1 }}>
                        <MessageSquare size={16} /> Open Ride Chat
                      </Link>
                      <button
                        onClick={handleConfirmCompletion}
                        className="btn btn-success"
                        disabled={myCompletionConfirmed}
                        style={{ flex: 1.2 }}
                      >
                        {myCompletionConfirmed ? <Check size={16} /> : <CheckCircle2 size={16} />}
                        {myCompletionConfirmed ? 'Completion Confirmed' : 'Confirm Completion'}
                      </button>
                    </>
                  )}
                  {ride.status === 'completed' && (
                    <div style={styles.infoText}>This ride has been completed. Review your passengers!</div>
                  )}
                  {ride.status === 'cancelled' && (
                    <div style={styles.infoTextError}>This ride was cancelled.</div>
                  )}
                </div>
              )}

              {/* IF PASSENGER ACTIONS */}
              {!isDriver && (
                <div style={styles.actionRow}>
                  {/* Case 1: No request yet */}
                  {!myRequest && ride.status === 'published' && (
                    <div style={{ width: '100%' }}>
                      {searchParams && (
                        <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(124, 77, 255, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(124, 77, 255, 0.2)' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Your Route</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--success)', flexShrink: 0 }}></div>
                              <strong>{searchParams.pickup.split(',').slice(0, 2).join(',')}</strong>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--danger)', flexShrink: 0 }}></div>
                              <strong>{searchParams.dropoff.split(',').slice(0, 2).join(',')}</strong>
                            </div>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={handleRequestJoin}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={new Date(ride.departure_time) <= new Date()}
                      >
                        {new Date(ride.departure_time) <= new Date() ? 'Ride Departed / Completed' : 'Request to Join Ride'}
                      </button>
                    </div>
                  )}
                  
                  {/* Case 2: Request pending */}
                  {myRequest && myRequest.status === 'pending' && (
                    <div style={styles.statusBox}>
                      <span className="badge badge-pending">Request Status: Pending</span>
                      <button onClick={handleCancelRequest} className="btn btn-secondary">
                        Withdraw Request
                      </button>
                    </div>
                  )}

                  {/* Case 3: Request rejected */}
                  {myRequest && myRequest.status === 'rejected' && (
                    <div style={styles.statusBox}>
                      <span className="badge badge-rejected">Request Status: Rejected</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Driver was unable to accept your request.
                      </span>
                    </div>
                  )}

                  {/* Case 4: Request accepted */}
                  {myRequest && myRequest.status === 'accepted' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                      <div style={styles.statusBox}>
                        <span className="badge badge-accepted">Booking Confirmed</span>
                      </div>
                      <div style={styles.actionRow}>
                        {ride.status === 'published' && (
                          <>
                            <Link to={`/chat/${ride.id}`} className="btn btn-primary" style={{ flex: 1 }}>
                              <MessageSquare size={16} /> Chat
                            </Link>
                            <button onClick={handleCancelRequest} className="btn btn-danger">
                              Cancel Booking
                            </button>
                          </>
                        )}
                        {ride.status === 'started' && (
                          <>
                            <Link to={`/chat/${ride.id}`} className="btn btn-primary" style={{ flex: 1 }}>
                              <MessageSquare size={16} /> Chat
                            </Link>
                            <button
                              onClick={handleConfirmCompletion}
                              className="btn btn-success"
                              disabled={myCompletionConfirmed}
                              style={{ flex: 1.2 }}
                            >
                              {myCompletionConfirmed ? <Check size={16} /> : <CheckCircle2 size={16} />}
                              {myCompletionConfirmed ? 'Completion Confirmed' : 'Confirm Completion'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {ride.status === 'completed' && (
                    <div style={styles.infoText}>This ride is completed. Leave reviews below!</div>
                  )}
                  {ride.status === 'cancelled' && (
                    <div style={styles.infoTextError}>This ride was cancelled.</div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Right Side: Co-passenger details & History log */}
        <div style={styles.rightCol}>
          {/* Confirmed Co-Passengers List */}
          <div className="glass-panel" style={styles.sidePanel}>
            <h3 style={styles.panelTitle}>Co-Passengers</h3>
            <div style={styles.participantsList}>
              {/* Driver (always top) */}
              <div style={styles.participantItem}>
                {ride.owner.profile_photo ? (
                  <img src={ride.owner.profile_photo} alt={ride.owner.name} style={styles.partAvatar} />
                ) : (
                  <div style={styles.partAvatarFallback}>{ride.owner.name.charAt(0).toUpperCase()}</div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={styles.partName}>{ride.owner.name}</strong>
                    <span style={styles.roleLabel}>Driver</span>
                  </div>
                  <div style={styles.partMeta}>
                    <Star size={11} fill="var(--warning)" color="var(--warning)" />
                    <span>{ride.owner.average_rating > 0 ? ride.owner.average_rating.toFixed(1) : "N/A"}</span>
                    <span>•</span>
                    <span>{ride.owner.reliability_score.toFixed(0)}% Reliability</span>
                  </div>
                </div>
                {ride.status === 'completed' && isPassenger && !ratedUsers[ride.owner_id] && (
                  <button
                    onClick={() => {
                      setRatingTargetId(ride.owner_id);
                      setRatingTargetName(ride.owner.name);
                    }}
                    style={styles.reviewBtn}
                    className="btn"
                  >
                    Rate Driver
                  </button>
                )}
              </div>

              {/* Passengers (visible only if user is confirmed participant) */}
              {!isConfirmedParticipant ? (
                <div style={styles.lockedBox}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Request to join this ride to see the passenger details.
                  </p>
                </div>
              ) : (
                participants
                  .filter(p => p.role === 'passenger')
                  .map((p) => (
                    <div key={p.id} style={styles.participantItem}>
                      {p.user.profile_photo ? (
                        <img src={p.user.profile_photo} alt={p.user.name} style={styles.partAvatar} />
                      ) : (
                        <div style={styles.partAvatarFallback}>{p.user.name.charAt(0).toUpperCase()}</div>
                      )}
                      <div style={{ flex: 1 }}>
                        <strong style={styles.partName}>{p.user.name}</strong>
                        {p.pickup_location && p.dropoff_location && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', marginBottom: '0.2rem' }}>
                            <span style={{ color: 'var(--success)' }}>{p.pickup_location.split(',')[0]}</span> → <span style={{ color: 'var(--danger)' }}>{p.dropoff_location.split(',')[0]}</span>
                          </div>
                        )}
                        <div style={styles.partMeta}>
                          <Star size={11} fill="var(--warning)" color="var(--warning)" />
                          <span>{p.user.average_rating > 0 ? p.user.average_rating.toFixed(1) : "N/A"}</span>
                          <span>•</span>
                          <span>{p.user.reliability_score.toFixed(0)}% Rel</span>
                        </div>
                      </div>
                      {ride.status === 'completed' && p.user_id !== user.id && !ratedUsers[p.user_id] && (
                        <button
                          onClick={() => {
                            setRatingTargetId(p.user_id);
                            setRatingTargetName(p.user.name);
                          }}
                          style={styles.reviewBtn}
                          className="btn"
                        >
                          Rate
                        </button>
                      )}
                    </div>
                  ))
              )}
              {isConfirmedParticipant && participants.filter(p => p.role === 'passenger').length === 0 && (
                <div style={{ padding: '1rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No passengers have joined this ride yet.
                </div>
              )}
            </div>
          </div>

          {/* Rating reviews form popup card */}
          {ratingTargetId && (
            <div className="glass-panel" style={styles.ratingFormCard}>
              <h4 style={{ marginBottom: '0.75rem' }}>Write review for {ratingTargetName}</h4>
              <form onSubmit={handleSubmitRating}>
                <div className="form-group">
                  <label className="form-label">Rating stars</label>
                  <select
                    className="form-input"
                    value={stars}
                    onChange={(e) => setStars(parseInt(e.target.value))}
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5 - Excellent)</option>
                    <option value="4">⭐⭐⭐⭐ (4 - Good)</option>
                    <option value="3">⭐⭐⭐ (3 - Average)</option>
                    <option value="2">⭐⭐ (2 - Below Average)</option>
                    <option value="1">⭐ (1 - Terrible)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Review Comment (Optional)</label>
                  <textarea
                    className="form-input"
                    placeholder="Tell us about your ride experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    style={{ height: '70px', resize: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.5rem' }}>
                    Submit Review
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setRatingTargetId('')}
                    style={{ padding: '0.5rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {ratingSuccess && (
            <div style={styles.successAlert}>
              <CheckCircle2 size={16} />
              <span>{ratingSuccess}</span>
            </div>
          )}

          {/* Audit History Logs (visible only if user is participant) */}
          {isConfirmedParticipant && history.length > 0 && (
            <div className="glass-panel" style={styles.sidePanel}>
              <h3 style={styles.panelTitle}>Ride Audit Trail</h3>
              <div style={styles.historyTimeline}>
                {history.map((log, index) => (
                  <div key={log.id} style={styles.timelineItem}>
                    <div style={styles.timelineIcon}>
                      <ChevronRight size={14} color="var(--accent-primary)" />
                    </div>
                    <div style={styles.timelineContent}>
                      <div style={styles.timelineAction}>{log.action}</div>
                      <div style={styles.timelineMeta}>
                        By {log.user_name} •{' '}
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '1.25rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
  },
  subtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    marginTop: '0.2rem',
  },
  costBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    backgroundColor: 'var(--card-inner-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '0.75rem 1.25rem',
  },
  costAmount: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '1.75rem',
    fontWeight: 700,
    color: 'var(--success)',
    fontFamily: 'var(--font-heading)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: '2.5rem',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  mapWrapper: {
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
  },
  detailsPanel: {
    padding: '2rem',
  },
  routeSection: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '2rem',
    backgroundColor: 'var(--card-inner-bg)',
    padding: '1.25rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
  },
  routePoint: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
  },
  routeIconWrapper: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    border: '1px solid var(--border-color)',
  },
  routeTextContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  routeLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    fontWeight: 600,
    letterSpacing: '0.05em',
  },
  routeAddress: {
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    marginTop: '0.15rem',
    lineHeight: '1.4',
  },
  routeConnector: {
    width: '2px',
    height: '24px',
    background: 'linear-gradient(to bottom, var(--success) 0%, var(--danger) 100%)',
    marginLeft: '17px',
    marginTop: '4px',
    marginBottom: '4px',
  },
  panelTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: '1.25rem',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '0.5rem',
    fontFamily: 'var(--font-heading)',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  detailItem: {
    display: 'flex',
    gap: '0.8rem',
  },
  detailValue: {
    display: 'block',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginTop: '0.2rem',
  },
  actionsBox: {
    borderTop: '1px solid var(--border-color)',
    paddingTop: '1.5rem',
  },
  actionRow: {
    display: 'flex',
    gap: '1rem',
    width: '100%',
  },
  statusBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: 'var(--card-inner-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
  },
  infoText: {
    color: 'var(--success)',
    fontWeight: 600,
    fontSize: '0.9rem',
    textAlign: 'center',
    width: '100%',
  },
  infoTextError: {
    color: 'var(--danger)',
    fontWeight: 600,
    fontSize: '0.9rem',
    textAlign: 'center',
    width: '100%',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  sidePanel: {
    padding: '1.5rem',
  },
  participantsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  participantItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid var(--border-color)',
  },
  participantItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  partAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  partAvatarFallback: {
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
  partName: {
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  roleLabel: {
    backgroundColor: 'rgba(124, 77, 255, 0.15)',
    color: 'var(--accent-primary)',
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '0.1rem 0.4rem',
    borderRadius: 'var(--radius-sm)',
    textTransform: 'uppercase',
  },
  partMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '0.1rem',
  },
  reviewBtn: {
    padding: '0.3rem 0.6rem',
    fontSize: '0.75rem',
    backgroundColor: 'rgba(124, 77, 255, 0.1)',
    color: 'var(--accent-primary)',
    border: '1px solid rgba(124, 77, 255, 0.2)',
  },
  lockedBox: {
    padding: '1.5rem 1rem',
    textAlign: 'center',
    backgroundColor: 'var(--card-inner-bg)',
    border: '1px dashed var(--border-color)',
    borderRadius: 'var(--radius-sm)',
  },
  historyTimeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  timelineItem: {
    display: 'flex',
    gap: '0.75rem',
  },
  timelineIcon: {
    marginTop: '0.2rem',
  },
  timelineContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  timelineAction: {
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  timelineMeta: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '0.1rem',
  },
  ratingFormCard: {
    padding: '1.25rem',
    border: '1px solid var(--accent-primary)',
    animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
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
  },
  errorBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    maxWidth: '500px',
    margin: '4rem auto 0 auto',
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
      div[style*="header"] { flex-direction: column !important; gap: 1rem !important; align-items: flex-start !important; }
      div[style*="costBox"] { align-items: flex-start !important; width: 100% !important; }
      div[style*="grid"] { grid-template-columns: 1fr !important; }
      div[style*="detailsGrid"] { grid-template-columns: 1fr !important; }
      div[style*="actionRow"] { flex-direction: column !important; }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default RideDetails;
