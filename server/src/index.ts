import { buildApp } from './app.js';

const app = buildApp();

const start = async () => {
  try {
    await app.listen({ port: app.config.PORT, host: '0.0.0.0' });
    app.log.info(`Server listening on ${app.config.PORT}`);
  } catch (error) {
    app.log.error(error, 'Failed to start server');
    process.exit(1);
  }
};

start();
