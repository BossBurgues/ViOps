import { app } from './app.js';
import { env } from './config/env.js';
import { disconnectPrisma } from './infra/prisma.js';

const server = app.listen(env.apiPort, () => {
  console.log(`viops-api listening on http://localhost:${env.apiPort}`);
});

async function shutdown() {
  server.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });
}

process.on('SIGINT', () => {
  void shutdown();
});

process.on('SIGTERM', () => {
  void shutdown();
});
