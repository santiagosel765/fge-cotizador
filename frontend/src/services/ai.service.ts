import { api } from '@/lib/api';

export const aiService = {
  chat: async (payload: unknown) => api.post('/ai/chat', payload),
  generatePlan: async (payload: unknown) => api.post('/ai/plan', payload),
  generateRender: async (projectId: string) => api.post(`/ai/render/${projectId}`),
  generatePanorama: async (projectId: string) => api.post(`/ai/panorama/${projectId}`),
};
