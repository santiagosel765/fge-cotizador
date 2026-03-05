import { api } from '@/lib/api';

export interface LaborConfig {
  id: string;
  projectType: string;
  label: string;
  percentage: number;
  isActive: boolean;
  updatedAt: string;
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export const laborConfigService = {
  async listConfigs(token: string): Promise<LaborConfig[]> {
    return api.get<LaborConfig[]>('/labor-configs', {
      headers: authHeaders(token),
    });
  },

  async updateConfig(id: string, percentage: number, token: string): Promise<LaborConfig> {
    return api.patch<LaborConfig>(`/labor-configs/${id}`, { percentage }, {
      headers: authHeaders(token),
    });
  },
};
