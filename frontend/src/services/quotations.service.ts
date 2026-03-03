import { api } from '@/lib/api';

export const quotationsService = {
  listByProject: async (projectId: string) => api.get(`/quotations?projectId=${projectId}`),
  create: async (payload: unknown) => api.post('/quotations', payload),
};
