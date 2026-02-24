import { apiClient } from './api.client';

export const materialsService = {
  list: async () => apiClient.get('/api/materials'),
};
