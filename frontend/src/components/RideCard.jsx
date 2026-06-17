import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Users, IndianRupee, Star, Award, ShieldCheck } from 'lucide-react';

const RideCard = ({ ride, showDetailsBtn = true }) => {
  // Format departure date
  const departureDate = new Date(ride.departure_time);
  const formattedDate = departureDate.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = departureDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="glass-panel glass-panel-hover animate-slide" style={styles.card}>
      {/* Driver info header */}
      <div style={styles.header}>
        <div style={styles.driverInfo}>
          {ride.owner.profile_photo ? (
            <img src={ride.owner.profile_photo} alt={ride.owner.name} style={styles.avatar} />
          ) : (
            <div style={styles.avatarFallback}>
              {ride.owner.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h4 style={styles.driverName}>{ride.owner.name}</h4>
            <div style={styles.driverMeta}>
              <span style={styles.rating}>
                <Star size={13} fill="var(--warning)" color="var(--warning)" />
                {ride.owner.average_rating > 0 ? ride.owner.average_rating.toFixed(1) : "N/A"}
              </span>
              <span style={styles.divider}>•</span>
              <span style={styles.reliability} title="Reliability Score">
                <ShieldCheck size={13} color="var(--accent-secondary)" />
                {ride.owner.reliability_score.toFixed(0)}% Rel
              </span>
            </div>
          </div>
        </div>
        <div style={styles.costBadge}>
          <IndianRupee size={14} color="var(--success)" />
          <span style={styles.costAmount}>{ride.final_cost}</span>
        </div>
      </div>

      {/* Ride Route body */}
      <div style={styles.routeContainer}>
        <div style={styles.routeLine}>
          <div style={styles.routeDotGreen} />
          <div style={styles.routeLineConnector} />
          <div style={styles.routeDotRed} />
        </div>
        <div style={styles.routeLabels}>
          <div style={styles.routeLocation}>
            <span style={styles.locationTitle}>Pickup</span>
            <span style={styles.locationName}>{ride.source}</span>
          </div>
          <div style={styles.routeLocation}>
            <span style={styles.locationTitle}>Dropoff</span>
            <span style={styles.locationName}>{ride.destination}</span>
          </div>
        </div>
      </div>

      {/* Ride Meta details */}
      <div style={styles.metaGrid}>
        <div style={styles.metaItem}>
          <Calendar size={15} color="var(--text-secondary)" />
          <span style={styles.metaText}>{formattedDate} at {formattedTime}</span>
        </div>
        <div style={styles.metaItem}>
          <Users size={15} color="var(--text-secondary)" />
          <span style={styles.metaText}>
            {ride.seats_available} {ride.seats_available === 1 ? 'seat' : 'seats'} left
          </span>
        </div>
        <div style={styles.metaItem}>
          <Award size={15} color="var(--text-secondary)" />
          <span style={styles.metaText}>
            {ride.vehicle.brand} {ride.vehicle.model} ({ride.vehicle.type})
          </span>
        </div>
      </div>

      {/* View details CTA */}
      {showDetailsBtn && (
        <Link to={`/rides/${ride.id}`} className="btn btn-primary" style={styles.cta}>
          View Details & Join
        </Link>
      )}
    </div>
  );
};

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid var(--border-color)',
  },
  driverInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  avatarFallback: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    color: 'var(--accent-primary)',
  },
  driverName: {
    fontSize: '0.95rem',
    fontWeight: 600,
  },
  driverMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    marginTop: '0.1rem',
  },
  rating: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.2rem',
  },
  reliability: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.2rem',
  },
  divider: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  costBadge: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    border: '1px solid rgba(0, 230, 118, 0.2)',
    padding: '0.4rem 0.8rem',
    borderRadius: 'var(--radius-sm)',
  },
  costAmount: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--success)',
    fontFamily: 'var(--font-heading)',
  },
  routeContainer: {
    display: 'flex',
    gap: '0.8rem',
  },
  routeLine: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0.3rem 0',
  },
  routeDotGreen: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--success)',
  },
  routeDotRed: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--danger)',
  },
  routeLineConnector: {
    width: '2px',
    flex: 1,
    backgroundColor: 'var(--border-color)',
    margin: '0.2rem 0',
  },
  routeLabels: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    flex: 1,
  },
  routeLocation: {
    display: 'flex',
    flexDirection: 'column',
  },
  locationTitle: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  locationName: {
    fontSize: '0.875rem',
    color: 'var(--text-primary)',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 1,
    WebkitBoxOrient: 'vertical',
  },
  metaGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.75rem',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  metaText: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  cta: {
    width: '100%',
    marginTop: '0.25rem',
  }
};

export default RideCard;
