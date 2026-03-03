import { api } from '@/lib/api';

export type CreateCreditRequestPayload = {
  projectId: string;
  applicantName: string;
  phone: string;
  notes?: string;
};

export type CreditRequestResponse = {
  id: string;
  ticketNumber: string;
  status: string;
  createdAt: string;
};

export const creditService = {
  create: async (payload: CreateCreditRequestPayload) => api.post<CreditRequestResponse>('/credit-requests', payload),
  list: async (projectId?: string) => {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return api.get<CreditRequestResponse[]>(`/credit-requests${query}`);
  },
};
