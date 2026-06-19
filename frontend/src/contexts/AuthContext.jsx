import React, { createContext, useState, useEffect, useContext } from 'react';
import authAPI from '../services/authAPI';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = authAPI.getToken();
      const cachedUser = authAPI.getCurrentUser();
      
      if (token && cachedUser) {
        try {
          // Verify token by fetching latest profile details
          const userData = await authAPI.getMe();
          setUser(userData);
          // Sync cache
          sessionStorage.setItem('coride_user', JSON.stringify({
            id: userData.id,
            name: userData.name
          }));
        } catch (error) {
          console.error("Auth initialization failed:", error);
          authAPI.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authAPI.login(email, password);
      // Fetch full profile immediately
      const fullUser = await authAPI.getMe();
      setUser(fullUser);
      setLoading(false);
      return fullUser;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (name, email, password, profilePhoto) => {
    setLoading(true);
    try {
      await authAPI.register(name, email, password, profilePhoto);
      // Fetch full profile
      const fullUser = await authAPI.getMe();
      setUser(fullUser);
      setLoading(false);
      return fullUser;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  const updateProfile = async (name, profilePhoto, drivingLicenseUrl, drivingLicenseExpiry, vehicleRcUrl, vehicleRcExpiry) => {
    const updated = await authAPI.updateProfile(
      name,
      profilePhoto,
      drivingLicenseUrl,
      drivingLicenseExpiry,
      vehicleRcUrl,
      vehicleRcExpiry
    );
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
