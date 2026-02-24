export type ProjectStatus = 'draft' | 'planned' | 'quoted' | 'credit_requested' | 'archived';

export interface Project {
  id: string;
  userId: string;
  name: string;
  userDescription: string;
  detailedConcept?: string | null;
  blueprintPrompt?: string | null;
  renderPrompt?: string | null;
  panoPrompt?: string | null;
  status: ProjectStatus;
  addressText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
