export type AiAssetType = 'blueprint' | 'render' | 'panorama';
export type AiAssetStatus = 'generating' | 'ready' | 'failed';

export interface AiAsset {
  id: string;
  projectId: string;
  assetType: AiAssetType;
  storageUrl: string;
  prompt: string;
  modelUsed: string;
  status: AiAssetStatus;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tokenCount?: number;
  createdAt: string;
}

export interface ProjectPlan {
  detailedConcept: string;
  blueprintPrompt: string;
  renderPrompt: string;
  panoPrompt: string;
}
