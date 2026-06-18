import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    animation: 'fadeIn 0.2s ease-out',
  },
  modal: {
    width: '90%',
    maxWidth: '400px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: 0,
  },
  message: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    lineHeight: 1.5,
    margin: 0,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '0.5rem',
  },
  btnCancel: {
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
  },
  btnConfirm: {
    // Default style, can be overridden by type (e.g. danger)
  }
};

const ConfirmModal = ({ 
  isOpen, 
  title = "Confirm Action", 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "danger" // "danger" | "primary"
}) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          {type === 'danger' && <AlertTriangle color="var(--danger)" size={24} />}
          <h3 style={styles.title}>{title}</h3>
        </div>
        <p style={styles.message}>{message}</p>
        <div style={styles.actions}>
          <button 
            className="btn" 
            style={styles.btnCancel} 
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            className={`btn btn-${type}`} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
