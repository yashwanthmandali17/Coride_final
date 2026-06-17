import React, { useState, useEffect } from 'react';
import rideAPI from '../services/rideAPI';
import RideCard from '../components/RideCard';
import RouteMap from '../components/RouteMap';
import { Search, MapPin, Calendar, Compass, List, AlertCircle } from 'lucide-react';

const SearchRide = () => {
  // Coordinates and text address states
  const [source, setSource] = useState({ lat: null, lng: null, address: '' });
  const [destination, setDestination] = useState({ lat: null, lng: null, address: '' });
  const [radius, setRadius] = useState(5.0); // km
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTimeOnly, setPreferredTimeOnly] = useState('');
  
  // Raw text input states
  const [sourceInput, setSourceInput] = useState('');
  const [destInput, setDestInput] = useState('');
  
  // Autocomplete suggestions states
  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [sourceSuggesting, setSourceSuggesting] = useState(false);
  const [isTypingSource, setIsTypingSource] = useState(false);

  const [destSuggestions, setDestSuggestions] = useState([]);
  const [destSuggesting, setDestSuggesting] = useState(false);
  const [isTypingDest, setIsTypingDest] = useState(false);
  
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced fetch for source suggestions
  useEffect(() => {
    if (!isTypingSource || sourceInput.trim().length < 3) {
      setSourceSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSourceSuggesting(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(sourceInput)}&limit=5&countrycodes=in&accept-language=en&email=coride-app@example.com`);
        const data = await res.json();
        setSourceSuggestions(data || []);
      } catch (err) {
        console.error("Geocoding suggestions error:", err);
      } finally {
        setSourceSuggesting(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [sourceInput, isTypingSource]);

  // Debounced fetch for destination suggestions
  useEffect(() => {
    if (!isTypingDest || destInput.trim().length < 3) {
      setDestSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setDestSuggesting(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destInput)}&limit=5&countrycodes=in&accept-language=en&email=coride-app@example.com`);
        const data = await res.json();
        setDestSuggestions(data || []);
      } catch (err) {
        console.error("Geocoding suggestions error:", err);
      } finally {
        setDestSuggesting(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [destInput, isTypingDest]);

  const handleMapCoordsChange = (type, lat, lng, address) => {
    if (type === 'source') {
      setIsTypingSource(false);
      setSource({ lat, lng, address });
      setSourceInput(address || '');
    } else if (type === 'destination') {
      setIsTypingDest(false);
      setDestination({ lat, lng, address });
      setDestInput(address || '');
    }
  };

  // No on-mount fetch - search results should only show after explicit search

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    let finalSource = { ...source };
    let finalDestination = { ...destination };

    // Resolve source if empty or text changed
    if (!finalSource.lat || finalSource.address !== sourceInput) {
      if (sourceInput.trim()) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(sourceInput)}&limit=1&countrycodes=in&accept-language=en`);
          const data = await res.json();
          if (data && data.length > 0) {
            finalSource = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), address: data[0].display_name };
            setSource(finalSource);
            setSourceInput(data[0].display_name);
          } else {
            setError(`Could not find coordinates for Pickup Location: "${sourceInput}" in India. Please enter a valid location.`);
            setLoading(false);
            return;
          }
        } catch (err) {
          setError('Network error resolving pickup location.');
          setLoading(false);
          return;
        }
      } else {
        setError('Please enter a pickup location.');
        setLoading(false);
        return;
      }
    }

    // Resolve destination if empty or text changed
    if (!finalDestination.lat || finalDestination.address !== destInput) {
      if (destInput.trim()) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destInput)}&limit=1&countrycodes=in&accept-language=en`);
          const data = await res.json();
          if (data && data.length > 0) {
            finalDestination = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), address: data[0].display_name };
            setDestination(finalDestination);
            setDestInput(data[0].display_name);
          } else {
            setError(`Could not find coordinates for Destination Location: "${destInput}" in India. Please enter a valid location.`);
            setLoading(false);
            return;
          }
        } catch (err) {
          setError('Network error resolving destination location.');
          setLoading(false);
          return;
        }
      } else {
        setError('Please enter a destination location.');
        setLoading(false);
        return;
      }
    }

    if (!finalSource.lat || !finalDestination.lat) {
      setError('Please type valid pickup and destination locations.');
      setLoading(false);
      return;
    }

    setHasSearched(true);

    try {
      const params = {
        s_lat: finalSource.lat,
        s_lng: finalSource.lng,
        d_lat: finalDestination.lat,
        d_lng: finalDestination.lng,
        radius: radius,
        preferred_time: preferredDate ? new Date(`${preferredDate}T${preferredTimeOnly || '00:00'}`).toISOString() : undefined
      };
      
      const data = await rideAPI.searchRides(params);
      setRides(data);
    } catch (err) {
      setError('Error searching matching rides. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSource({ lat: null, lng: null, address: '' });
    setDestination({ lat: null, lng: null, address: '' });
    setSourceInput('');
    setDestInput('');
    setIsTypingSource(false);
    setIsTypingDest(false);
    setSourceSuggestions([]);
    setDestSuggestions([]);
    setRadius(5.0);
    setPreferredDate('');
    setPreferredTimeOnly('');
    setHasSearched(false);
    setError('');
    setRides([]);
  };

  return (
    <div style={styles.container} className="animate-fade">
      {/* Top Banner */}
      <div style={styles.heroSection}>
        <h2 style={styles.heroTitle}>Find a Shared Ride</h2>
        <p style={styles.heroSubtitle}>
          Enter your start and end locations in the text fields and match with drivers instantly.
        </p>
      </div>

      <div style={styles.mainGrid}>
        {/* Left Column: Search Form and Route Display Map */}
        <div style={styles.leftCol}>
          <div className="glass-panel" style={styles.searchFormPanel}>
            <form onSubmit={handleSearch}>
              <div style={styles.formGrid}>
                
                 {/* Pickup Address Input */}
                 <div className="form-group" style={{ gridColumn: 'span 2', position: 'relative' }}>
                   <label className="form-label">Pickup Location</label>
                   <div style={styles.inputWrapper}>
                     <MapPin size={18} style={{ ...styles.inputIcon, color: 'var(--success)' }} />
                     <input
                       type="text"
                       className="form-input"
                       placeholder="Type pickup location (e.g. Miyapur)..."
                       value={sourceInput}
                       onChange={(e) => {
                         setSourceInput(e.target.value);
                         setIsTypingSource(true);
                       }}
                       style={{ paddingLeft: '2.5rem' }}
                       required
                     />
                     {sourceSuggesting && <div className="autocomplete-spinner" style={{ position: 'absolute', right: '12px' }} />}
                   </div>
                   {sourceSuggestions.length > 0 && (
                     <div className="autocomplete-dropdown">
                       {sourceSuggestions.map((item) => (
                         <div
                           key={item.place_id}
                           className="autocomplete-item"
                           onClick={() => {
                             setSource({
                               lat: parseFloat(item.lat),
                               lng: parseFloat(item.lon),
                               address: item.display_name
                             });
                             setSourceInput(item.display_name);
                             setIsTypingSource(false);
                             setSourceSuggestions([]);
                           }}
                         >
                           <MapPin size={14} style={{ flexShrink: 0, color: 'var(--success)' }} />
                           <span>{item.display_name}</span>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
 
                 {/* Dropoff Address Input */}
                 <div className="form-group" style={{ gridColumn: 'span 2', position: 'relative' }}>
                   <label className="form-label">Destination Location</label>
                   <div style={styles.inputWrapper}>
                     <MapPin size={18} style={{ ...styles.inputIcon, color: 'var(--danger)' }} />
                     <input
                       type="text"
                       className="form-input"
                       placeholder="Type destination location (e.g. LB Nagar)..."
                       value={destInput}
                       onChange={(e) => {
                         setDestInput(e.target.value);
                         setIsTypingDest(true);
                       }}
                       style={{ paddingLeft: '2.5rem' }}
                       required
                     />
                     {destSuggesting && <div className="autocomplete-spinner" style={{ position: 'absolute', right: '12px' }} />}
                   </div>
                   {destSuggestions.length > 0 && (
                     <div className="autocomplete-dropdown">
                       {destSuggestions.map((item) => (
                         <div
                           key={item.place_id}
                           className="autocomplete-item"
                           onClick={() => {
                             setDestination({
                               lat: parseFloat(item.lat),
                               lng: parseFloat(item.lon),
                               address: item.display_name
                             });
                             setDestInput(item.display_name);
                             setIsTypingDest(false);
                             setDestSuggestions([]);
                           }}
                         >
                           <MapPin size={14} style={{ flexShrink: 0, color: 'var(--danger)' }} />
                           <span>{item.display_name}</span>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>

                {/* Radius Slider */}
                <div className="form-group">
                  <label className="form-label">Search Radius ({radius.toFixed(1)} km)</label>
                  <div style={styles.sliderWrapper}>
                    <Compass size={18} color="var(--text-secondary)" />
                    <input
                      type="range"
                      min="1"
                      max="15"
                      step="0.5"
                      value={radius}
                      onChange={(e) => setRadius(parseFloat(e.target.value))}
                      style={styles.slider}
                    />
                  </div>
                </div>

                {/* Preferred Date & Time Split Inputs */}
                <div className="form-group" style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Preferred Date (Optional)</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Calendar size={18} style={styles.inputIcon} />
                      <input
                        type="date"
                        className="form-input"
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        style={{ paddingLeft: '2.5rem' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Preferred Time (Optional)</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Calendar size={18} style={styles.inputIcon} />
                      <input
                        type="time"
                        className="form-input"
                        value={preferredTimeOnly}
                        onChange={(e) => setPreferredTimeOnly(e.target.value)}
                        style={{ paddingLeft: '2.5rem' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div style={styles.errorAlert}>
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div style={styles.formActions}>
                <button type="submit" className="btn btn-primary" style={styles.searchBtn} disabled={loading}>
                  <Search size={18} /> Search Matches
                </button>
                {(hasSearched || sourceInput.trim()) && (
                  <button type="button" className="btn btn-secondary" onClick={handleReset}>
                    Reset
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Route Map Viewer (Interactive Mode) */}
          <div style={styles.mapContainer}>
            <RouteMap
              mode="interactive"
              sourceLat={source.lat}
              sourceLng={source.lng}
              destinationLat={destination.lat}
              destinationLng={destination.lng}
              onChangeCoords={handleMapCoordsChange}
              height="280px"
            />
          </div>
        </div>

        {/* Right Column: Search Results List */}
        <div style={styles.rightCol}>
          <div style={styles.feedHeader}>
            <h3 style={styles.feedTitle}>
              <List size={20} color="var(--accent-primary)" />
              {hasSearched ? 'Matched Rides' : 'Available Upcoming Rides'}
            </h3>
            <span style={styles.feedCount}>{rides.length} rides found</span>
          </div>

          {loading ? (
            <div style={styles.loaderContainer}>
              <div style={styles.spinner} />
              <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Resolving locations & matching routes...</p>
            </div>
          ) : !hasSearched ? (
            <div className="glass-panel" style={styles.emptyCard}>
              <Compass size={32} color="var(--accent-primary)" />
              <h4 style={{ marginTop: '0.5rem' }}>Search for a Ride</h4>
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                Enter your pickup and destination locations in the search form to match with drivers.
              </p>
            </div>
          ) : rides.length === 0 ? (
            <div className="glass-panel" style={styles.emptyCard}>
              <AlertCircle size={32} color="var(--text-muted)" />
              <h4>No matching rides found</h4>
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                Try adjusting your pickup/dropoff details or increasing your search radius filter.
              </p>
            </div>
          ) : (
            <div style={styles.resultsList}>
              {rides.map((ride) => (
                <RideCard key={ride.id} ride={ride} />
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
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '2rem',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  searchFormPanel: {
    padding: '1.5rem',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.25rem',
    marginBottom: '1rem',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  sliderWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    height: '43px',
  },
  slider: {
    flex: 1,
    accentColor: 'var(--accent-primary)',
    cursor: 'pointer',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
    zIndex: 2,
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
    marginBottom: '1rem',
  },
  formActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  searchBtn: {
    flex: 1,
  },
  mapContainer: {
    overflow: 'hidden',
    borderRadius: 'var(--radius-md)',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  feedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '0.5rem',
  },
  feedTitle: {
    fontSize: '1.2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  feedCount: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  resultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    overflowY: 'auto',
    maxHeight: '780px',
    paddingRight: '0.25rem',
  },
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6rem 0',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid var(--bg-tertiary)',
    borderTopColor: 'var(--accent-primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  emptyCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    borderRadius: 'var(--radius-md)',
  },
};

// Insert spin keyframes stylesheet
if (typeof window !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @media (max-width: 1024px) {
      div[style*="mainGrid"] { grid-template-columns: 1fr !important; }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default SearchRide;
