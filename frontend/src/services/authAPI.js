import api from './api';

const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data && response.data.access_token) {
      localStorage.setItem('coride_token', response.data.access_token);
      localStorage.setItem('coride_user', JSON.stringify({
        id: response.data.user_id,
        name: response.data.name,
      }));
    }
    return response.data;
  },

  register: async (name, email, password, profilePhoto = null) => {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      profile_photo: profilePhoto,
    });
    if (response.data && response.data.access_token) {
      localStorage.setItem('coride_token', response.data.access_token);
      localStorage.setItem('coride_user', JSON.stringify({
        id: response.data.user_id,
        name: response.data.name,
      }));
    }
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  getSystemEmail: async () => {
    const response = await api.get('/auth/system-email');
    return response.data;
  },

  updateProfile: async (name, profilePhoto) => {
    const response = await api.put('/users/me', {
      name,
      profile_photo: profilePhoto,
    });
    return response.data;
  },

  getUserProfile: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('coride_token');
    localStorage.removeItem('coride_user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('coride_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: () => {
    return localStorage.getItem('coride_token');
  }
};

export default authAPI;
