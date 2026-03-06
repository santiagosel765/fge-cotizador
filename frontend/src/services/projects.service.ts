import { api } from '@/lib/api';
import { Project, ProjectStatus } from '@/types/project.types';

interface ProjectFilters {
  search?: string;
  status?: string;
}

interface QuotationSummaryItem {
  id: string;
  quantity: number;
  subtotalGtq: number;
  material?: {
    name?: string;
    unit?: string;
  } | null;
}

interface QuotationSummary {
  subtotalGtq?: number;
  ivaGtq?: number;
  totalGtq?: number;
  laborGtq?: number | null;
  laborPct?: number | null;
  laborProjectType?: string | null;
  versionNumber?: number;
  createdAt?: string;
  items?: QuotationSummaryItem[];
}

export interface ProjectAiAsset {
  id: string;
  assetType: string;
  status?: string;
  storageUrl?: string;
}

export interface ProjectRecord extends Project {
  quotations?: QuotationSummary[];
  aiAssets?: ProjectAiAsset[];
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    role: string;
  } | null;
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export const projectsService = {
  async listProjects(filters: ProjectFilters = {}, token: string): Promise<ProjectRecord[]> {
    const params = new URLSearchParams();

    if (filters.search) {
      params.set('search', filters.search);
    }

    if (filters.status && filters.status !== 'all') {
      params.set('status', filters.status);
    }

    const query = params.toString();
    return api.get<ProjectRecord[]>(`/projects${query ? `?${query}` : ''}`, {
      headers: authHeaders(token),
    });
  },

  async getProject(id: string, token: string): Promise<ProjectRecord> {
    return api.get<ProjectRecord>(`/projects/${id}`, {
      headers: authHeaders(token),
    });
  },

  async updateProjectStatus(id: string, status: ProjectStatus, token: string): Promise<ProjectRecord> {
    return api.patch<ProjectRecord>(`/projects/${id}/status`, { status }, {
      headers: authHeaders(token),
    });
  },
};
