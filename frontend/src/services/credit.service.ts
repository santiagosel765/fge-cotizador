import { api } from '@/lib/api';

export const creditService = {
  create: async (payload: unknown) => api.post('/credit-requests', payload),
  list: async () => api.get('/credit-requests'),
};
