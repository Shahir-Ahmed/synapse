import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './server/api';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  
  // Parse JSON bodies
  app.use(express.json({ limit: '100kb' }));

  // Mount API endpoints
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Keep unknown API paths from falling through to the SPA HTML response.
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode: mount Vite dev server middlewares
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = Number(err?.status) === 400 ? 400 : 500;
    if (status === 400) {
      return res.status(400).json({ error: 'Invalid JSON request body.' });
    }
    console.error('[ClearFeedback] Request failed.');
    return res.status(500).json({ error: 'An unexpected server error occurred.' });
  });

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ClearFeedback] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[ClearFeedback] Server failed to start:', err);
  process.exit(1);
});
