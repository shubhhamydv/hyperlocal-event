import apiClient from './client';

export const eventsApi = {
  /**
   * Discover published upcoming events with optional location, radius, and filters
   * @param {{ lat?: number, lng?: number, radiusKm?: number, category?: string, q?: string, free?: string|boolean, mode?: string, page?: number, limit?: number }} params
   * @returns {Promise<{ events: Array<any>, total: number }>}
   */
  getEvents: async (params = {}) => {
    const response = await apiClient.get('/events', { params });
    return response.data;
  },

  /**
   * Get all events created by the logged-in organizer (all statuses)
   * @returns {Promise<{ events: Array<any> }>}
   */
  getMyEvents: async () => {
    const response = await apiClient.get('/events/mine');
    return response.data;
  },

  /**
   * Get single event by ID
   * @param {string} id
   * @returns {Promise<{ event: any }>}
   */
  getEventById: async (id) => {
    const response = await apiClient.get(`/events/${id}`);
    return response.data;
  },

  /**
   * Create a new event (organizer only)
   * @param {Object} eventData
   * @returns {Promise<{ event: any }>}
   */
  createEvent: async (eventData) => {
    const response = await apiClient.post('/events', eventData);
    return response.data;
  },

  /**
   * Update an existing event (owner only)
   * @param {string} id
   * @param {Object} eventData
   * @returns {Promise<{ event: any }>}
   */
  updateEvent: async (id, eventData) => {
    const response = await apiClient.patch(`/events/${id}`, eventData);
    return response.data;
  },

  /**
   * Cancel an event (owner only)
   * @param {string} id
   * @returns {Promise<{ event: any }>}
   */
  cancelEvent: async (id) => {
    const response = await apiClient.post(`/events/${id}/cancel`);
    return response.data;
  }
};

export default eventsApi;
