import { apiClient } from './api.client';

export const quotationsService = {
  listByProject: async (projectId: string) => apiClient.get(`/api/quotations?projectId=${projectId}`),
  create: async (payload: unknown) => apiClient.post('/api/quotations', payload),
};
