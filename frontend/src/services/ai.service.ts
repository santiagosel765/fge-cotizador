import { apiClient } from './api.client';

export const aiService = {
  generatePlan: async (projectId: string) => apiClient.post(`/api/projects/${projectId}/plan`),
  listAssets: async (projectId: string) => apiClient.get(`/api/projects/${projectId}/assets`),
  sendMessage: async (projectId: string, payload: unknown) =>
    apiClient.post(`/api/projects/${projectId}/chat`, payload),
};
