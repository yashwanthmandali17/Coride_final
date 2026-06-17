import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import rideAPI from '../services/rideAPI';
import RouteMap from '../components/RouteMap';
import { PlusCircle, MapPin, Calendar, Users, IndianRupee, Award, AlertTriangle, CheckCircle } from 'lucide-react';

// Simple JS implementation of Haversine formula
const localHaversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371.0;
  const dlat = (lat2 - lat1) * Math.PI / 180;
  const dlon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dlat / 2) * Math.sin(dlat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dlon / 2) * Math.sin(dlon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const PublishRide = () => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [source, setSource] = useState({ lat: null, lng: null, address: '' });
  const [destination, setDestination] = useState({ lat: null, lng: null, address: '' });
  const [departureDate, setDepartureDate] = useState('');
  const [departureTimeOnly, setDepartureTimeOnly] = useState('');
  const [seatsAvailable, setSeatsAvailable] = useState(1);
  
  // Pricing states
  const [pricingOption, setPricingOption] = useState('system'); // 'system' | 'driver'
  const [finalCost, setFinalCost] = useState('');
  const [autoCost, setAutoCost] = useState(0.0);
  const [distanceKm, setDistanceKm] = useState(0.0);
  const [fuelPrice, setFuelPrice] = useState(100.0);
  const [mileage, setMileage] = useState(12.0);
  
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

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

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

  // Load user's vehicles on mount
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const data = await rideAPI.getVehicles();
        setVehicles(data);
        if (data.length > 0) {
          setSelectedVehicleId(data[0].id);
        }
      } catch (err) {
        setError('Failed to load vehicles. You need a vehicle to publish a ride.');
      } finally {
        setFetchLoading(false);
      }
    };
    loadVehicles();
  }, []);

  // Sync default mileage when selected vehicle changes
  useEffect(() => {
    if (selectedVehicleId && vehicles.length > 0) {
      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      if (vehicle) {
        setMileage(vehicle.type === 'car' ? 12.0 : (vehicle.type === 'auto' ? 25.0 : 40.0));
      }
    }
  }, [selectedVehicleId, vehicles]);

  // Recalculate auto-cost whenever coordinates, selected vehicle, fuelPrice, or mileage changes
  useEffect(() => {
    if (source.lat && destination.lat && selectedVehicleId) {
      const dist = localHaversine(source.lat, source.lng, destination.lat, destination.lng) * 1.3;
      setDistanceKm(dist);

      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      if (vehicle) {
        const tripCost = (dist / (parseFloat(mileage) || 1.0)) * (parseFloat(fuelPrice) || 0.0);
        const estimatedPerSeat = tripCost / vehicle.seat_capacity;
        
        const rounded = Math.round(estimatedPerSeat * 100) / 100;
        setAutoCost(rounded);
        // Force sync final cost to auto cost if pricingOption is 'system'
        if (pricingOption === 'system') {
          setFinalCost(rounded.toString());
        }
      }
    }
  }, [source, destination, selectedVehicleId, vehicles, pricingOption, fuelPrice, mileage]);

  const handleVehicleChange = (e) => {
    const id = e.target.value;
    setSelectedVehicleId(id);
    const vehicle = vehicles.find(v => v.id === id);
    if (vehicle && seatsAvailable > vehicle.seat_capacity) {
      setSeatsAvailable(vehicle.seat_capacity);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedVehicleId) {
      setError('Please add a vehicle to your profile before publishing a ride.');
      return;
    }
    if (!sourceInput.trim() || !destInput.trim()) {
      setError('Please enter both pickup and destination locations.');
      return;
    }
    if (!departureDate || !departureTimeOnly) {
      setError('Please select both departure date and time.');
      return;
    }
    const depTime = new Date(`${departureDate}T${departureTimeOnly}`);
    if (depTime <= new Date()) {
      setError('Departure time must be in the future.');
      return;
    }

    setLoading(true);
    let finalSource = { ...source };
    let finalDestination = { ...destination };

    // Resolve Pickup Coordinates
    if (!finalSource.lat || finalSource.address !== sourceInput) {
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
    }

    // Resolve Destination Coordinates
    if (!finalDestination.lat || finalDestination.address !== destInput) {
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
    }

    // Double check that route is geocoded
    if (!finalSource.lat || !finalDestination.lat) {
      setError('Locations must be successfully geocoded to proceed.');
      setLoading(false);
      return;
    }

    // Recalculate cost splits on resolved coordinates
    const dist = localHaversine(finalSource.lat, finalSource.lng, finalDestination.lat, finalDestination.lng) * 1.3;
    const vehicle = vehicles.find(v => v.id === selectedVehicleId);
    let resolvedCost = parseFloat(finalCost);

    if (pricingOption === 'system' && vehicle) {
      const tripCost = (dist / (parseFloat(mileage) || 1.0)) * (parseFloat(fuelPrice) || 0.0);
      const estimatedPerSeat = tripCost / vehicle.seat_capacity;
      resolvedCost = Math.round(estimatedPerSeat * 100) / 100;
    }

    if (isNaN(resolvedCost) || resolvedCost < 0) {
      setError('Please provide a valid pricing amount.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        source: finalSource.address,
        destination: finalDestination.address,
        source_lat: finalSource.lat,
        source_lng: finalSource.lng,
        destination_lat: finalDestination.lat,
        destination_lng: finalDestination.lng,
        departure_time: new Date(`${departureDate}T${departureTimeOnly}`).toISOString(),
        seats_available: parseInt(seatsAvailable),
        final_cost: resolvedCost,
        vehicle_id: selectedVehicleId
      };

      await rideAPI.publishRide(payload);
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to publish ride. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.spinner} />
      </div>
    );
  }

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  return (
    <div style={styles.container} className="animate-fade">
      <div style={styles.heroSection}>
        <h2 style={styles.heroTitle}>Publish a Ride Offer</h2>
        <p style={styles.heroSubtitle}>
          Select your vehicle, enter start and end locations, customize your cost split, and publish.
        </p>
      </div>

      {vehicles.length === 0 ? (
        <div className="glass-panel" style={styles.warningCard}>
          <AlertTriangle size={36} color="var(--warning)" />
          <h3>No Registered Vehicle Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            You must add a vehicle (car or bike) in your profile page before you can publish a ride offer.
          </p>
          <Link to="/profile" className="btn btn-primary">
            Go to Profile
          </Link>
        </div>
      ) : success ? (
        <div className="glass-panel" style={styles.successCard}>
          <CheckCircle size={48} color="var(--success)" />
          <h3>Ride Offer Published Successfully!</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Redirecting to your driver dashboard...
          </p>
        </div>
      ) : (
        <div style={styles.mainGrid}>
          {/* Left Column: Form details */}
          <div className="glass-panel" style={styles.formPanel}>
            <form onSubmit={handleSubmit}>
              <div style={styles.formFields}>
                
                {/* Vehicle Choice */}
                <div className="form-group">
                  <label className="form-label">Select Vehicle</label>
                  <div style={styles.inputWrapper}>
                    <Award size={18} style={styles.inputIcon} />
                    <select
                      className="form-input"
                      value={selectedVehicleId}
                      onChange={handleVehicleChange}
                      style={{ paddingLeft: '2.5rem' }}
                      required
                    >
                      {vehicles.map(v => (
                        <option
                          key={v.id}
                          value={v.id}
                          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        >
                          {v.brand} {v.model} ({v.registration_number})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Seat Capacity */}
                <div className="form-group">
                  <label className="form-label">Available Passenger Seats</label>
                  <div style={styles.inputWrapper}>
                    <Users size={18} style={styles.inputIcon} />
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      max={selectedVehicle ? selectedVehicle.seat_capacity : 4}
                      value={seatsAvailable}
                      onChange={(e) => setSeatsAvailable(parseInt(e.target.value))}
                      style={{ paddingLeft: '2.5rem' }}
                      required
                    />
                  </div>
                  {selectedVehicle && (
                    <span style={styles.helperText}>Max: {selectedVehicle.seat_capacity} seats</span>
                  )}
                </div>

                 {/* Departure Date & Time Split Inputs */}
                 <div className="form-group" style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                   <div>
                     <label className="form-label">Departure Date</label>
                     <div style={styles.inputWrapper}>
                       <Calendar size={18} style={styles.inputIcon} />
                       <input
                         type="date"
                         className="form-input"
                         min={new Date().toLocaleDateString('en-CA')}
                         value={departureDate}
                         onChange={(e) => setDepartureDate(e.target.value)}
                         style={{ paddingLeft: '2.5rem' }}
                         required
                       />
                     </div>
                   </div>
                   <div>
                     <label className="form-label">Departure Time</label>
                     <div style={styles.inputWrapper}>
                       <Calendar size={18} style={styles.inputIcon} />
                       <input
                         type="time"
                         className="form-input"
                         value={departureTimeOnly}
                         onChange={(e) => setDepartureTimeOnly(e.target.value)}
                         style={{ paddingLeft: '2.5rem' }}
                         required
                       />
                     </div>
                   </div>
                 </div>

                {/* Source Input */}
                <div className="form-group" style={{ gridColumn: 'span 2', position: 'relative' }}>
                  <label className="form-label">Pickup Location</label>
                  <div style={styles.inputWrapper}>
                    <MapPin size={18} style={{ ...styles.inputIcon, color: 'var(--success)' }} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter pickup location..."
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

                {/* Destination Input */}
                <div className="form-group" style={{ gridColumn: 'span 2', position: 'relative' }}>
                  <label className="form-label">Destination Location</label>
                  <div style={styles.inputWrapper}>
                    <MapPin size={18} style={{ ...styles.inputIcon, color: 'var(--danger)' }} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter destination location..."
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

                {/* Pricing Selection Option */}
                <div className="form-group" style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                  <label className="form-label">Pricing Calculation Mode</label>
                  <div style={styles.radioGroup}>
                    <label style={styles.radioLabel}>
                      <input
                        type="radio"
                        name="pricingOption"
                        value="system"
                        checked={pricingOption === 'system'}
                        onChange={() => {
                          setPricingOption('system');
                          setFinalCost(autoCost.toString());
                        }}
                        style={styles.radioInput}
                      />
                      <span>System Cost Share (₹{autoCost})</span>
                    </label>
                    <label style={styles.radioLabel}>
                      <input
                        type="radio"
                        name="pricingOption"
                        value="driver"
                        checked={pricingOption === 'driver'}
                        onChange={() => setPricingOption('driver')}
                        style={styles.radioInput}
                      />
                      <span>Driver Specified Flat Price</span>
                    </label>
                  </div>
                </div>

                {pricingOption === 'system' && (
                  <div className="form-group animate-slide" style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Fuel Price (₹ / L)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        className="form-input"
                        value={fuelPrice}
                        onChange={(e) => setFuelPrice(parseFloat(e.target.value) || '')}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Vehicle Mileage (km / L)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        className="form-input"
                        value={mileage}
                        onChange={(e) => setMileage(parseFloat(e.target.value) || '')}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Cost Panel Input */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Final Seat Cost (INR ₹)</label>
                  <div style={styles.inputWrapper}>
                    <IndianRupee size={18} style={styles.inputIcon} />
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={finalCost}
                      onChange={(e) => setFinalCost(e.target.value)}
                      style={{ paddingLeft: '2.5rem' }}
                      disabled={pricingOption === 'system'}
                      required
                    />
                  </div>
                  {pricingOption === 'system' && (
                    <span style={styles.helperText}>
                      Disabled: Auto-calculated based on distance ({distanceKm.toFixed(1)} km) and vehicle mileage.
                    </span>
                  )}
                </div>
              </div>

              {error && (
                <div style={styles.errorAlert}>
                  <AlertTriangle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={loading}>
                <PlusCircle size={18} />
                {loading ? 'Resolving route & publishing...' : 'Publish Ride Offer'}
              </button>
            </form>
          </div>

          {/* Right Column: Leaflet Map Route Viewer (Interactive Mode) */}
          <div style={styles.mapContainer}>
            <RouteMap
              mode="interactive"
              sourceLat={source.lat}
              sourceLng={source.lng}
              destinationLat={destination.lat}
              destinationLng={destination.lng}
              onChangeCoords={handleMapCoordsChange}
              height="350px"
            />
          </div>
        </div>
      )}
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
    gridTemplateColumns: '1fr 1.2fr',
    gap: '2rem',
  },
  formPanel: {
    padding: '2rem',
  },
  formFields: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.25rem',
    marginBottom: '1.5rem',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
    zIndex: 2,
  },
  helperText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '0.25rem',
    display: 'block',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginTop: '0.25rem',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  radioInput: {
    accentColor: 'var(--accent-primary)',
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
  submitBtn: {
    width: '100%',
  },
  mapContainer: {
    overflow: 'hidden',
    borderRadius: 'var(--radius-md)',
  },
  warningCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    borderRadius: 'var(--radius-md)',
  },
  successCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5rem 2rem',
    borderRadius: 'var(--radius-md)',
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

// Add responsive layout styles
if (typeof window !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    @media (max-width: 1024px) {
      div[style*="mainGrid"] { grid-template-columns: 1fr !important; }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default PublishRide;
