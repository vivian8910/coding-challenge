import 'dotenv/config';
import { buildApp } from './app';

const DEFAULT_PORT = 3000;

const start = async (): Promise<void> => {
  const app = buildApp();
  const port = Number(process.env.PORT ?? DEFAULT_PORT);

  try {
    await app.listen({ port, host: '0.0.0.0' });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();
