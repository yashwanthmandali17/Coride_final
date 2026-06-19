import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import rideAPI from '../services/rideAPI';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import ConfirmModal from '../components/ConfirmModal';
import { Car, Bike, PlusCircle, CreditCard, Trash2, CheckCircle, ShieldAlert, ChevronLeft } from 'lucide-react';

const Vehicles = () => {
  const { user } = useAuth();
  const { addToast } = useNotifications();

  // Vehicle list state
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
  const [rcToDeleteVehicleId, setRcToDeleteVehicleId] = useState(null);

  // New Vehicle RC inputs
  const [vRcUrl, setVRcUrl] = useState('');
  const [vRcExpiry, setVRcExpiry] = useState('');
  const [showNewRcPreview, setShowNewRcPreview] = useState(false);

  // Existing Vehicle RC inline editing states
  const [activeRcEditVehicleId, setActiveRcEditVehicleId] = useState(null);
  const [editRcUrl, setEditRcUrl] = useState('');
  const [editRcExpiry, setEditRcExpiry] = useState('');
  const [editRcLoading, setEditRcLoading] = useState(false);
  const [showRcPreviews, setShowRcPreviews] = useState({});

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

  const handleFileUpload = (e, setUrl) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // limit to 2MB
        addToast('Error', 'File size exceeds 2MB limit. Please upload a smaller image.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getExpiryStatusBadge = (expiryDateStr) => {
    if (!expiryDateStr) {
      return <span style={{ ...styles.badge, ...styles.badgeMissing }}>No RC Uploaded</span>;
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
        seat_capacity: parseInt(vCapacity),
        rc_url: vRcUrl || null,
        rc_expiry: vRcExpiry || null
      });
      setVehicleSuccess('Vehicle added successfully!');
      
      // Reset vehicle fields
      setVBrand('');
      setVModel('');
      setVRegNum('');
      setVCapacity(vType === 'car' ? 4 : (vType === 'auto' ? 3 : 1));
      setVRcUrl('');
      setVRcExpiry('');
      
      // Reload vehicle list
      loadVehicles();
      setTimeout(() => setVehicleSuccess(''), 3000);
    } catch (err) {
      setVehicleError(err.response?.data?.detail || 'Failed to register vehicle. Verify unique registration number.');
    } finally {
      setVehicleLoading(false);
    }
  };

  const handleUpdateVehicleRc = async (vehicleId) => {
    setEditRcLoading(true);
    try {
      await rideAPI.updateVehicle(vehicleId, {
        rc_url: editRcUrl || null,
        rc_expiry: editRcExpiry || null
      });
      addToast('Success', 'Vehicle RC updated successfully.', 'success');
      setActiveRcEditVehicleId(null);
      setEditRcUrl('');
      setEditRcExpiry('');
      loadVehicles();
    } catch (err) {
      addToast('Error', err.response?.data?.detail || 'Failed to update vehicle RC.', 'error');
    } finally {
      setEditRcLoading(false);
    }
  };

  const startRcEdit = (vehicle) => {
    setActiveRcEditVehicleId(vehicle.id);
    setEditRcUrl(vehicle.rc_url || '');
    setEditRcExpiry(vehicle.rc_expiry || '');
  };

  const toggleRcPreview = (vehicleId) => {
    setShowRcPreviews(prev => ({
      ...prev,
      [vehicleId]: !prev[vehicleId]
    }));
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

  const confirmDeleteRc = async () => {
    if (!rcToDeleteVehicleId) return;
    try {
      await rideAPI.updateVehicle(rcToDeleteVehicleId, {
        rc_url: "",
        rc_expiry: ""
      });
      addToast('Success', 'Vehicle Registration Certificate (RC) deleted successfully.', 'success');
      loadVehicles();
    } catch (err) {
      addToast('Error', err.response?.data?.detail || 'Failed to delete vehicle RC.', 'error');
    } finally {
      setRcToDeleteVehicleId(null);
    }
  };

  const handleVTypeChange = (e) => {
    const type = e.target.value;
    setVType(type);
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

      <ConfirmModal
        isOpen={!!rcToDeleteVehicleId}
        title="Delete RC Document"
        message="Are you sure you want to delete the Registration Certificate (RC) document for this vehicle? You will need to upload a valid RC to publish future rides using this vehicle."
        confirmText="Delete RC"
        type="danger"
        onConfirm={confirmDeleteRc}
        onCancel={() => setRcToDeleteVehicleId(null)}
      />

      {/* Back to Profile Link */}
      <div style={styles.backWrapper}>
        <Link to="/profile" style={styles.backLink}>
          <ChevronLeft size={16} /> Back to Profile
        </Link>
      </div>

      <div style={styles.heroSection}>
        <h2 style={styles.heroTitle}>Registered Vehicles</h2>
        <p style={styles.heroSubtitle}>
          Register your cars, bikes, or autos, and upload their Registration Certificates (RC) securely.
        </p>
      </div>

      <div style={styles.grid}>
        {/* Left Column: Vehicles List */}
        <div style={styles.leftCol}>
          <div className="glass-panel" style={styles.panel}>
            <h3 style={styles.panelTitle}>Your Registered Vehicles</h3>
            <div style={styles.vehiclesList}>
              {vehicles.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 1rem' }}>
                  No vehicles registered yet. Add one to start offering rides.
                </div>
              ) : (
                vehicles.map((v) => (
                  <div key={v.id} style={{ ...styles.vehicleItem, flexDirection: 'column', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <strong style={styles.vehicleName}>{v.brand} {v.model}</strong>
                          {getExpiryStatusBadge(v.rc_expiry)}
                        </div>
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

                    {/* RC Document Actions */}
                    <div style={styles.rcActionRow}>
                      {v.rc_url ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => toggleRcPreview(v.id)}
                            style={styles.viewRcBtn}
                          >
                            {showRcPreviews[v.id] ? 'Hide RC Document' : 'View RC Document'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setRcToDeleteVehicleId(v.id)}
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.2rem 0.5rem',
                              backgroundColor: 'rgba(255, 23, 68, 0.1)',
                              border: '1px solid rgba(255, 23, 68, 0.2)',
                              color: 'var(--danger)',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}
                          >
                            Delete RC
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}>
                          ⚠️ Secure RC document missing.
                        </span>
                      )}

                      {activeRcEditVehicleId === v.id ? (
                        <div style={styles.rcEditBox}>
                          <h4 style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Update RC Details:</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.75rem' }}>Expiry Date</label>
                              <input
                                type="date"
                                className="form-input"
                                value={editRcExpiry}
                                onChange={(e) => setEditRcExpiry(e.target.value)}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.75rem' }}>RC Image File</label>
                              <div style={styles.uploadContainer}>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleFileUpload(e, setEditRcUrl)}
                                  style={styles.fileInput}
                                  id={`edit-rc-file-${v.id}`}
                                />
                                <label htmlFor={`edit-rc-file-${v.id}`} style={{ ...styles.uploadLabel, padding: '0.5rem', fontSize: '0.75rem' }} className="btn btn-secondary">
                                  Choose Image
                                </label>
                              </div>
                            </div>
                          </div>
                          {editRcUrl && (
                            <div style={{ ...styles.documentPreviewWrapper, maxHeight: '120px', marginTop: '0.5rem' }}>
                              <img src={editRcUrl} alt="RC Edit Preview" style={{ ...styles.documentPreview, maxHeight: '100px' }} />
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ flex: 1, padding: '0.3rem', fontSize: '0.75rem' }}
                              onClick={() => handleUpdateVehicleRc(v.id)}
                              disabled={editRcLoading}
                            >
                              {editRcLoading ? 'Saving...' : 'Save RC'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ flex: 1, padding: '0.3rem', fontSize: '0.75rem' }}
                              onClick={() => setActiveRcEditVehicleId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startRcEdit(v)}
                          style={styles.addRcBtn}
                        >
                          {v.rc_url ? 'Replace RC' : 'Add RC Document'}
                        </button>
                      )}
                    </div>

                    {v.rc_url && showRcPreviews[v.id] && (
                      <div style={{ ...styles.documentPreviewWrapper, marginTop: '0.5rem', maxHeight: '180px' }}>
                        <img src={v.rc_url} alt={`${v.brand} RC`} style={{ ...styles.documentPreview, maxHeight: '160px' }} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Add Vehicle Form */}
        <div style={styles.rightCol}>
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
                    <option value="auto" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>🛺 Auto</option>
                  </select>
                </div>

                {/* Seat Capacity */}
                <div className="form-group">
                  <label className="form-label">Seat Capacity</label>
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
                    placeholder="e.g. Maruti, Honda"
                    value={vBrand}
                    onChange={(e) => setVBrand(e.target.value)}
                    required
                  />
                </div>

                {/* Model */}
                <div className="form-group">
                  <label className="form-label">Model</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Swift, Activa"
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
                      placeholder="e.g. KA-03-HA-1234"
                      value={vRegNum}
                      onChange={(e) => setVRegNum(e.target.value)}
                      style={{ paddingLeft: '2.5rem' }}
                      required
                    />
                  </div>
                </div>

                {/* RC Expiry Date */}
                <div className="form-group">
                  <label className="form-label">RC Expiry Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={vRcExpiry}
                    onChange={(e) => setVRcExpiry(e.target.value)}
                  />
                </div>

                {/* RC Document Upload */}
                <div className="form-group">
                  <label className="form-label">RC Document Image</label>
                  <div style={styles.uploadContainer}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setVRcUrl)}
                      style={styles.fileInput}
                      id="new-v-rc-upload"
                    />
                    <label htmlFor="new-v-rc-upload" style={{ ...styles.uploadLabel, padding: '0.55rem' }} className="btn btn-secondary">
                      Upload RC Image
                    </label>
                  </div>
                </div>

                {vRcUrl && (
                  <div style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowNewRcPreview(!showNewRcPreview)}
                      style={styles.previewToggle}
                      className="btn"
                    >
                      {showNewRcPreview ? 'Hide RC Preview' : 'View RC Preview'}
                    </button>
                    {showNewRcPreview && (
                      <div style={styles.documentPreviewWrapper}>
                        <img src={vRcUrl} alt="New RC preview" style={styles.documentPreview} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={vehicleLoading}>
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
  backWrapper: {
    marginBottom: '1rem',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontWeight: 500,
    transition: 'color var(--transition-fast)',
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
    gridTemplateColumns: '1.2fr 1fr',
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
  vehiclesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  vehicleItem: {
    display: 'flex',
    padding: '1rem',
    backgroundColor: 'var(--card-inner-bg)',
    borderRadius: 'var(--radius-md)',
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
    fontSize: '0.95rem',
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
    padding: '0.4rem',
    transition: 'color var(--transition-fast)',
  },
  rcActionRow: {
    borderTop: '1px solid var(--border-color)',
    marginTop: '0.75rem',
    paddingTop: '0.5rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    alignItems: 'center',
  },
  viewRcBtn: {
    fontSize: '0.75rem',
    padding: '0.2rem 0.5rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
  },
  addRcBtn: {
    fontSize: '0.75rem',
    padding: '0.2rem 0.5rem',
    background: 'var(--accent-gradient)',
    border: 'none',
    color: '#fff',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    fontWeight: 600,
  },
  rcEditBox: {
    width: '100%',
    marginTop: '0.5rem',
    padding: '0.75rem',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
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
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    color: '#ff1744',
    border: '1px solid rgba(244, 63, 94, 0.3)',
  },
  badgeWarning: {
    backgroundColor: 'rgba(255, 140, 0, 0.15)',
    color: '#ff8c00',
    border: '1px solid rgba(255, 140, 0, 0.3)',
  },
  badgeValid: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    color: '#00e676',
    border: '1px solid rgba(0, 230, 118, 0.3)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.25rem',
  },
  uploadContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  fileInput: {
    position: 'absolute',
    left: 0,
    top: 0,
    opacity: 0,
    width: '100%',
    height: '100%',
    cursor: 'pointer',
  },
  uploadLabel: {
    width: '100%',
    textAlign: 'center',
    cursor: 'pointer',
    padding: '0.6rem',
    display: 'block',
  },
  previewContainer: {
    marginTop: '0.75rem',
  },
  previewToggle: {
    fontSize: '0.8rem',
    padding: '0.4rem 0.8rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    width: '100%',
    textAlign: 'center',
  },
  documentPreviewWrapper: {
    marginTop: '0.75rem',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    border: '1px solid var(--border-color)',
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: '#000',
    padding: '0.5rem',
  },
  documentPreview: {
    maxWidth: '100%',
    maxHeight: '220px',
    objectFit: 'contain',
    borderRadius: 'var(--radius-sm)',
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
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    border: '1px solid rgba(244, 63, 94, 0.2)',
    color: 'var(--danger)',
    padding: '0.8rem 1rem',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.85rem',
    marginBottom: '1.5rem',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
};

// Add responsive layout styles dynamically
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

export default Vehicles;
