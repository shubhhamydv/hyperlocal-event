import apiClient from './client';

export const organizerRegistrationsApi = {
  /**
   * Get registrations for a specific event (event owner only)
   * @param {string} eventId
   * @returns {Promise<{ registrations: Array<{ id: string, status: string, checkedIn: boolean, createdAt: string, user: { name: string, email: string } }> }>}
   */
  getEventRegistrations: async (eventId) => {
    const response = await apiClient.get(`/registrations/event/${eventId}`);
    return response.data;
  }
};

export const { getEventRegistrations } = organizerRegistrationsApi;
export default organizerRegistrationsApi;
