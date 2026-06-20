import api from './api';

const rideAPI = {
  // Vehicles CRUD
  getVehicles: async () => {
    const response = await api.get('/vehicles');
    return response.data;
  },
  
  addVehicle: async (vehicleData) => {
    const response = await api.post('/vehicles', vehicleData);
    return response.data;
  },
  
  deleteVehicle: async (vehicleId) => {
    await api.delete(`/vehicles/${vehicleId}`);
    return true;
  },

  updateVehicle: async (vehicleId, vehicleData) => {
    const response = await api.put(`/vehicles/${vehicleId}`, vehicleData);
    return response.data;
  },

  // Rides Management
  publishRide: async (rideData) => {
    const response = await api.post('/rides', rideData);
    return response.data;
  },

  searchRides: async (params) => {
    // params = { s_lat, s_lng, d_lat, d_lng, preferred_time, radius }
    const response = await api.get('/rides', { params });
    return response.data;
  },

  getMyRides: async () => {
    const response = await api.get('/rides/my-rides');
    return response.data;
  },

  getRideDetails: async (rideId) => {
    const response = await api.get(`/rides/${rideId}`);
    return response.data;
  },

  updateRideStatus: async (rideId, status, cancellationReason = null) => {
    const response = await api.put(`/rides/${rideId}`, { status, cancellation_reason: cancellationReason });
    return response.data;
  },

  // Requests Flow
  requestRide: async (rideId, payload = {}) => {
    const response = await api.post('/requests', { ride_id: rideId, ...payload });
    return response.data;
  },

  updateRequestStatus: async (requestId, status, cancellationReason = null) => {
    // status = 'accepted' | 'rejected' | 'cancelled'
    const response = await api.put(`/requests/${requestId}`, { status, cancellation_reason: cancellationReason });
    return response.data;
  },

  getMyRequests: async () => {
    const response = await api.get('/requests/my-requests');
    return response.data;
  },

  getIncomingRequests: async () => {
    const response = await api.get('/requests/incoming');
    return response.data;
  },

  getRideParticipants: async (rideId) => {
    const response = await api.get(`/requests/rides/${rideId}/participants`);
    return response.data;
  },

  confirmCompletion: async (rideId) => {
    const response = await api.post(`/requests/rides/${rideId}/complete`);
    return response.data;
  },

  // Ratings
  submitRating: async (ratingData) => {
    // ratingData = { ride_id, reviewee_id, stars, comment }
    const response = await api.post('/ratings', ratingData);
    return response.data;
  },

  // History / Logs
  getRideHistory: async (rideId) => {
    const response = await api.get(`/history/${rideId}`);
    return response.data;
  },

  // Notifications
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  readAllNotifications: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  readNotification: async (notifId) => {
    const response = await api.put(`/notifications/${notifId}/read`);
    return response.data;
  }
};

export default rideAPI;
