import { apiClient } from './api.client';

export const projectsService = {
  list: async () => apiClient.get('/api/projects'),
  getById: async (id: string) => apiClient.get(`/api/projects/${id}`),
  create: async (payload: unknown) => apiClient.post('/api/projects', payload),
};
