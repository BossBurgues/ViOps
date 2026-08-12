import 'dotenv/config';

export const env = {
  apiPort: Number(process.env.API_PORT ?? 3333),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
};
