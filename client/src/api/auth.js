import apiClient from './client';

export const authApi = {
  /**
   * Register a new user
   * @param {{ name: string, email: string, password: string, role: 'attendee'|'organizer', interests?: string[], city?: string }} data
   * @returns {Promise<{ token: string, user: { id: string, name: string, email: string, role: string, interests: string[], city?: string } }>}
   */
  register: async (data) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  /**
   * Login user with email and password
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<{ token: string, user: { id: string, name: string, email: string, role: string, interests: string[], city?: string } }>}
   */
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Get current authenticated user profile
   * @returns {Promise<{ user: { id: string, name: string, email: string, role: string, interests: string[], city?: string } }>}
   */
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }
};

export default authApi;
