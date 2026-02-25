const { GoogleGenerativeAI } = require('@google/generative-ai');

class GoogleGenAI {
  constructor(options = {}) {
    const apiKey = options.apiKey;
    this._client = new GoogleGenerativeAI(apiKey);
    this.models = {
      generateContent: async ({ model, contents }) => {
        const geminiModel = this._client.getGenerativeModel({ model });
        const result = await geminiModel.generateContent(contents);
        const text = result.response?.text?.() || '';
        return {
          text,
          candidates: [
            {
              content: {
                parts: text ? [{ text }] : [],
              },
            },
          ],
        };
      },
    };
  }
}

module.exports = { GoogleGenAI };
