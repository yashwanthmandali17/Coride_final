import React, { useState, useEffect } from 'react';
import authAPI from '../services/authAPI';
import rideAPI from '../services/rideAPI';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import ConfirmModal from '../components/ConfirmModal';
import { User, Award, ShieldCheck, Star, Plus, Trash2, ShieldAlert, CheckCircle, Car, Bike, PlusCircle, CreditCard } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { addToast } = useNotifications();
  
  // Profile update state
  const [name, setName] = useState(user?.name || '');
  const [profilePhoto, setProfilePhoto] = useState(user?.profile_photo || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Vehicle state
  const [vehicles, setVehicles] = useState([]);
  const [vType, setVType] = useState('car');
  const [vBrand, setVBrand] = useState('');
  const [vModel, setVModel] = useState('');
  const [vRegNum, setVRegNum] = useState('');
  const [vCapacity, setVCapacity] = useState(4);
  const [vehicleSuccess, setVehicleSuccess] = useState('');
  const [vehicleError, setVehicleError] = useState('');
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);

  const loadVehicles = async () => {
    try {
      const data = await rideAPI.getVehicles();
      setVehicles(data);
    } catch (err) {
      console.error("Failed to load vehicles:", err);
    }
  };

  useEffect(() => {
    if (user) {
      loadVehicles();
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setProfileLoading(true);

    try {
      await updateProfile(name, profilePhoto || null);
      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err) {
      setProfileError('Failed to update profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setVehicleSuccess('');
    setVehicleError('');
    setVehicleLoading(true);

    try {
      await rideAPI.addVehicle({
        type: vType,
        brand: vBrand,
        model: vModel,
        registration_number: vRegNum,
        seat_capacity: parseInt(vCapacity)
      });
      setVehicleSuccess('Vehicle added successfully!');
      
      // Reset vehicle fields
      setVBrand('');
      setVModel('');
      setVRegNum('');
      setVCapacity(vType === 'car' ? 4 : (vType === 'auto' ? 3 : 1));
      
      // Reload vehicle list
      loadVehicles();
      setTimeout(() => setVehicleSuccess(''), 3000);
    } catch (err) {
      setVehicleError(err.response?.data?.detail || 'Failed to register vehicle. Verify unique registration number.');
    } finally {
      setVehicleLoading(false);
    }
  };

  const handleDeleteVehicle = (vehicleId) => {
    setVehicleToDelete(vehicleId);
  };

  const confirmDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    try {
      await rideAPI.deleteVehicle(vehicleToDelete);
      addToast('Success', 'Vehicle deleted successfully.', 'success');
      loadVehicles();
    } catch (err) {
      addToast('Error', 'Failed to delete vehicle. It may be linked to active published rides.', 'error');
    } finally {
      setVehicleToDelete(null);
    }
  };

  const handleVTypeChange = (e) => {
    const type = e.target.value;
    setVType(type);
    // Set typical defaults
    setVCapacity(type === 'car' ? 4 : (type === 'auto' ? 3 : 1));
  };

  return (
    <div style={styles.container} className="animate-fade">
      <ConfirmModal
        isOpen={!!vehicleToDelete}
        title="Delete Vehicle"
        message="Are you sure you want to delete this vehicle? Any active rides using this vehicle will not be deleteable unless cancelled."
        confirmText="Delete Vehicle"
        type="danger"
        onConfirm={confirmDeleteVehicle}
        onCancel={() => setVehicleToDelete(null)}
      />

      <div style={styles.heroSection}>
        <h2 style={styles.heroTitle}>Profile Management</h2>
        <p style={styles.heroSubtitle}>
          Manage your personal details, verify passenger metrics, and register your car or bike vehicle logs.
        </p>
      </div>

      <div style={styles.grid}>
        
        {/* Left Column: Personal info edit */}
        <div style={styles.leftCol}>
          <div className="glass-panel" style={styles.panel}>
            <h3 style={styles.panelTitle}>
              <User size={18} color="var(--accent-primary)" /> Profile Information
            </h3>

            <div style={styles.metricsBox}>
              <div style={styles.metricItem}>
                <ShieldCheck size={20} color="var(--accent-secondary)" />
                <div>
                  <span style={styles.metricLabel}>Reliability Score</span>
                  <span style={styles.metricVal}>{user.reliability_score.toFixed(0)}%</span>
                </div>
              </div>
              <div style={styles.metricItem}>
                <Star size={20} fill="var(--warning)" color="var(--warning)" />
                <div>
                  <span style={styles.metricLabel}>Average Rating</span>
                  <span style={styles.metricVal}>{user.average_rating > 0 ? `${user.average_rating.toFixed(1)} / 5` : 'No reviews'}</span>
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
                  value={user.email}
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

        {/* Right Column: Vehicles CRUD */}
        <div style={styles.rightCol}>
          {/* Vehicles List */}
          <div className="glass-panel" style={{ ...styles.panel, marginBottom: '2rem' }}>
            <h3 style={styles.panelTitle}>Registered Vehicles</h3>
            <div style={styles.vehiclesList}>
              {vehicles.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
                  No vehicles registered yet. Add one below to start offering rides.
                </div>
              ) : (
                vehicles.map((v) => (
                  <div key={v.id} style={styles.vehicleItem}>
                    <div style={styles.vehicleIcon}>
                      {v.type === 'car' ? (
                        <Car size={20} color="var(--accent-primary)" />
                      ) : v.type === 'auto' ? (
                        <span style={{ fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>🛺</span>
                      ) : (
                        <Bike size={20} color="var(--accent-secondary)" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={styles.vehicleName}>{v.brand} {v.model}</strong>
                      <div style={styles.vehicleMeta}>
                        <span>{v.registration_number}</span>
                        <span>•</span>
                        <span>Capacity: {v.seat_capacity} passenger{v.seat_capacity > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteVehicle(v.id)}
                      style={styles.deleteBtn}
                      title="Remove Vehicle"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add Vehicle Form */}
          <div className="glass-panel" style={styles.panel}>
            <h3 style={styles.panelTitle}>
              <PlusCircle size={18} color="var(--accent-secondary)" /> Add New Vehicle
            </h3>

            {vehicleSuccess && (
              <div style={styles.successAlert}>
                <CheckCircle size={16} />
                <span>{vehicleSuccess}</span>
              </div>
            )}
            {vehicleError && (
              <div style={styles.errorAlert}>
                <ShieldAlert size={16} />
                <span>{vehicleError}</span>
              </div>
            )}

            <form onSubmit={handleAddVehicle}>
              <div style={styles.formGrid}>
                {/* Vehicle Type */}
                <div className="form-group">
                  <label className="form-label">Vehicle Type</label>
                  <select
                    className="form-input"
                    value={vType}
                    onChange={handleVTypeChange}
                    required
                  >
                    <option value="car" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>🚗 Car</option>
                    <option value="bike" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>🏍️ Bike</option>
                    <option value="auto" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>🛺 Auto (3-Seater)</option>
                  </select>
                </div>

                {/* Seat Capacity */}
                <div className="form-group">
                  <label className="form-label">Max Seat Capacity</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max={vType === 'car' ? 8 : (vType === 'auto' ? 3 : 1)}
                    value={vCapacity}
                    onChange={(e) => setVCapacity(parseInt(e.target.value))}
                    required
                  />
                </div>

                {/* Brand */}
                <div className="form-group">
                  <label className="form-label">Brand</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Toyota, Honda"
                    value={vBrand}
                    onChange={(e) => setVBrand(e.target.value)}
                    required
                  />
                </div>

                {/* Model */}
                <div className="form-group">
                  <label className="form-label">Model Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Corolla, Civic"
                    value={vModel}
                    onChange={(e) => setVModel(e.target.value)}
                    required
                  />
                </div>

                {/* Registration Number */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Registration Number</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <CreditCard size={18} style={styles.inputIcon} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. DL3C-AB1234"
                      value={vRegNum}
                      onChange={(e) => setVRegNum(e.target.value)}
                      style={{ paddingLeft: '2.5rem' }}
                      required
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={vehicleLoading}>
                {vehicleLoading ? 'Adding Vehicle...' : 'Register Vehicle'}
              </button>
            </form>
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
    gridTemplateColumns: '1fr 1.2fr',
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
  vehiclesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  vehicleItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem 1rem',
    backgroundColor: 'var(--card-inner-bg)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
  },
  vehicleIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleName: {
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  vehicleMeta: {
    display: 'flex',
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '0.1rem',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '0.5rem',
    transition: 'color var(--transition-fast)',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '0.5rem',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.25rem',
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
      div[style*="grid"] { grid-template-columns: 1fr !important; }
      div[style*="formGrid"] { grid-template-columns: 1fr !important; }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default Profile;
