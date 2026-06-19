import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import ConfirmModal from '../components/ConfirmModal';
import { CreditCard, CheckCircle, ShieldAlert, ChevronLeft, Trash2 } from 'lucide-react';

const DigitalWallet = () => {
  const { user, updateProfile } = useAuth();
  const { addToast } = useNotifications();

  const [drivingLicenseUrl, setDrivingLicenseUrl] = useState(user?.driving_license_url || '');
  const [drivingLicenseExpiry, setDrivingLicenseExpiry] = useState(user?.driving_license_expiry || '');
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletSuccess, setWalletSuccess] = useState('');
  const [walletError, setWalletError] = useState('');
  const [showDlPreview, setShowDlPreview] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDeleteLicense = async () => {
    setWalletSuccess('');
    setWalletError('');
    setWalletLoading(true);
    try {
      await updateProfile(
        user.name,
        user.profile_photo || null,
        "",
        ""
      );
      setDrivingLicenseUrl('');
      setDrivingLicenseExpiry('');
      addToast('Success', 'Driving License deleted successfully.', 'success');
      setShowConfirmDelete(false);
    } catch (err) {
      setWalletError('Failed to delete Driving License. Please try again.');
      addToast('Error', 'Failed to delete Driving License.', 'error');
    } finally {
      setWalletLoading(false);
    }
  };

  // Sync state with user context updates
  useEffect(() => {
    if (user) {
      setDrivingLicenseUrl(user.driving_license_url || '');
      setDrivingLicenseExpiry(user.driving_license_expiry || '');
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

  const handleUpdateWallet = async (e) => {
    e.preventDefault();
    setWalletSuccess('');
    setWalletError('');
    setWalletLoading(true);

    try {
      await updateProfile(
        user.name,
        user.profile_photo || null,
        drivingLicenseUrl || null,
        drivingLicenseExpiry || null
      );
      setWalletSuccess('Driving License updated successfully!');
      addToast('Success', 'Driving License updated successfully.', 'success');
      setTimeout(() => setWalletSuccess(''), 3000);
    } catch (err) {
      setWalletError('Failed to update Driving License. Please try again.');
      addToast('Error', 'Failed to update Driving License.', 'error');
    } finally {
      setWalletLoading(false);
    }
  };

  return (
    <div style={styles.container} className="animate-fade">
      <ConfirmModal
        isOpen={showConfirmDelete}
        title="Delete Driving License"
        message="Are you sure you want to delete your Driving License? Drivers must have valid licenses registered to publish commute rides."
        confirmText="Delete License"
        type="danger"
        onConfirm={handleDeleteLicense}
        onCancel={() => setShowConfirmDelete(false)}
      />

      {/* Back button link */}
      <div style={styles.backWrapper}>
        <Link to="/profile" style={styles.backLink}>
          <ChevronLeft size={16} /> Back to Profile
        </Link>
      </div>

      <div style={styles.heroSection}>
        <h2 style={styles.heroTitle}>Digital Wallet</h2>
        <p style={styles.heroSubtitle}>
          Securely upload and manage your Driving License documents for fast verification at police checkposts.
        </p>
      </div>

      <div style={styles.panelWrapper}>
        <div className="glass-panel" style={styles.panel}>
          <h3 style={styles.panelTitle}>
            <CreditCard size={18} color="var(--accent-secondary)" /> Digital Wallet (Driver License)
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.4' }}>
            Upload your Driving License privately to access it quickly at highway checkpoints. It is stored securely and <strong>only visible to you</strong>.
          </p>

          {walletSuccess && (
            <div style={styles.successAlert}>
              <CheckCircle size={16} />
              <span>{walletSuccess}</span>
            </div>
          )}
          {walletError && (
            <div style={styles.errorAlert}>
              <ShieldAlert size={16} />
              <span>{walletError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateWallet}>
            {/* Driving License Section */}
            <div style={styles.documentSection}>
              <div style={styles.documentHeader}>
                <strong style={styles.documentTitle}>Driving License</strong>
                {getDlExpiryStatusBadge(drivingLicenseExpiry)}
              </div>
              
              <div style={styles.formGrid}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Expiry Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={drivingLicenseExpiry}
                    onChange={(e) => setDrivingLicenseExpiry(e.target.value)}
                  />
                </div>
                
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">License Document (Image)</label>
                  <div style={styles.uploadContainer}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setDrivingLicenseUrl)}
                      style={styles.fileInput}
                      id="dl-upload"
                    />
                    <label htmlFor="dl-upload" style={styles.uploadLabel} className="btn btn-secondary">
                      Upload License Image
                    </label>
                  </div>
                </div>
              </div>

              {drivingLicenseUrl && (
                <div style={styles.previewContainer}>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowDlPreview(!showDlPreview)}
                      style={{ ...styles.previewToggle, flex: 1, marginTop: 0 }}
                      className="btn"
                    >
                      {showDlPreview ? 'Hide Document' : 'View Uploaded Document'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmDelete(true)}
                      style={{
                        padding: '0.4rem 1rem',
                        backgroundColor: 'rgba(255, 23, 68, 0.1)',
                        border: '1px solid rgba(255, 23, 68, 0.2)',
                        color: 'var(--danger)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.8rem'
                      }}
                    >
                      <Trash2 size={16} /> Delete License
                    </button>
                  </div>
                  {showDlPreview && (
                    <div style={styles.documentPreviewWrapper}>
                      <img src={drivingLicenseUrl} alt="Driving License" style={styles.documentPreview} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={walletLoading}>
              {walletLoading ? 'Saving License...' : 'Save License'}
            </button>
          </form>
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
  panelWrapper: {
    maxWidth: '650px',
    margin: '0 auto',
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
  documentSection: {
    marginBottom: '1.5rem',
  },
  documentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  documentTitle: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
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
};

export default DigitalWallet;
