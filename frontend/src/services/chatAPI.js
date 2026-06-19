import api, { API_BASE_URL } from './api';

const chatAPI = {
  getChatHistory: async (rideId) => {
    const response = await api.get(`/chat/${rideId}/history`);
    return response.data;
  },

  getWebSocketURL: (rideId) => {
    const token = sessionStorage.getItem('coride_token');
    // Replace http:// or https:// with ws:// or wss://
    let wsBaseUrl = API_BASE_URL.replace(/^http/, 'ws');
    return `${wsBaseUrl}/chat/ws/${rideId}?token=${token}`;
  }
};

export default chatAPI;
