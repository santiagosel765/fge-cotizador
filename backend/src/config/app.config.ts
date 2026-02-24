export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3001),
  jwtSecret: process.env.JWT_SECRET || 'change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    modelPlan: process.env.GEMINI_MODEL_PLAN || 'gemini-2.5-pro',
    modelChat: process.env.GEMINI_MODEL_CHAT || 'gemini-2.5-flash',
    modelImage: process.env.GEMINI_MODEL_IMAGE || 'imagen-4.0-generate-001',
  },
  assetsBaseUrl: process.env.ASSETS_BASE_URL || 'http://localhost:3001/assets',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 60),
});
