import apiClient from './client';

/**
 * Registrations API service
 * Interacts with /api/registrations endpoints
 */
export const register = async (eventId) => {
  const response = await apiClient.post('/registrations', { eventId });
  return response.data;
};

export const cancel = async (registrationId) => {
  const response = await apiClient.delete(`/registrations/${registrationId}`);
  return response.data;
};

export const mine = async () => {
  const response = await apiClient.get('/registrations/mine');
  return response.data;
};

export const status = async (eventId) => {
  const response = await apiClient.get(`/registrations/status/${eventId}`);
  return response.data;
};

const registrationsApi = {
  register,
  cancel,
  mine,
  status,
};

export default registrationsApi;
