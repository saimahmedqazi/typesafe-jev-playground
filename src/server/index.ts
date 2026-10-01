import express from 'express';
import cors from 'cors';

export const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '1mb' }));

/**
 * Health check endpoint providing execution mode information
 * and affirming zero application-owner credential fallback.
 */
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supportedModes: ['llm-practice', 'native-jev'],
    ownerFallbackEnabled: false,
    version: '1.0.0',
    description: 'TypeSafe Jev Playground API'
  });
});

// Start listener only when running directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[TypeSafe Jev Playground API] Running on http://localhost:${PORT}`);
    console.log(`[Security] Zero-fallback BYOK enforcement active. Application-owner keys are disabled.`);
  });
}
