import { apiClient } from './api.client';

export const creditService = {
  create: async (payload: unknown) => apiClient.post('/api/credit-requests', payload),
  list: async () => apiClient.get('/api/credit-requests'),
};
