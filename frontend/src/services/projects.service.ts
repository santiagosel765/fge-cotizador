import { api } from '@/lib/api';

export const projectsService = {
  list: async () => api.get('/projects'),
  getById: async (id: string) => api.get(`/projects/${id}`),
  create: async (payload: unknown) => api.post('/projects', payload),
};
