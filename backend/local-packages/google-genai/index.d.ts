export type GenerateContentOptions = {
  model: string;
  contents: string;
  config?: {
    responseModalities?: string[];
  };
};

export type GenerateContentResponse = {
  text?: string;
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: {
          mimeType?: string;
          data?: string;
        };
      }>;
    };
  }>;
};

export declare class GoogleGenAI {
  constructor(options: { apiKey: string });
  models: {
    generateContent(options: GenerateContentOptions): Promise<GenerateContentResponse>;
  };
}
