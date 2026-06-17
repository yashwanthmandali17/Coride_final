import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import Navbar from './components/Navbar';

// Page Imports
import Login from './pages/Login';
import Register from './pages/Register';
import SearchRide from './pages/SearchRide';
import PublishRide from './pages/PublishRide';
import Dashboard from './pages/Dashboard';
import RideDetails from './pages/RideDetails';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import RideHistory from './pages/RideHistory';

// Toast Container overlay component
const ToastOverlay = () => {
  const { toasts, dismissToast } = useNotifications();
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => dismissToast(toast.id)}
          style={{ cursor: 'pointer' }}
        >
          <div>
            <strong style={{ display: 'block', fontSize: '0.85rem' }}>{toast.title}</strong>
            <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>{toast.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Route protector wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={styles.spinnerContainer}>
        <div style={styles.spinner} />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Main Layout Wrapper
const AppLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content animate-fade">
        {children}
      </main>
      <ToastOverlay />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout>
                  <SearchRide />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/publish" element={
              <ProtectedRoute>
                <AppLayout>
                  <PublishRide />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/rides/:rideId" element={
              <ProtectedRoute>
                <AppLayout>
                  <RideDetails />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/chat/:rideId" element={
              <ProtectedRoute>
                <AppLayout>
                  <Chat />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/history" element={
              <ProtectedRoute>
                <AppLayout>
                  <RideHistory />
                </AppLayout>
              </ProtectedRoute>
            } />

            {/* Catch all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

const styles = {
  spinnerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)',
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

export default App;
