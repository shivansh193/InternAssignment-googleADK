
  // src/config/index.ts
  import dotenv from 'dotenv';
  
  dotenv.config();
  
  export const config = {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    geminiApiKey: process.env.GEMINI_API_KEY,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    }
  };
  
  if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
  
 