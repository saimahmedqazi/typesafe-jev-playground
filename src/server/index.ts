import express from 'express';
import cors from 'cors';
import { securityHeadersMiddleware, createRateLimiter, sanitizedErrorHandler } from './middleware/security';
import { defaultEvaluationHandlers } from './evaluate';

export const app = express();
const PORT = process.env.PORT || 3001;

// 1. Security Headers
app.use(securityHeadersMiddleware);

// 2. CORS configuration
app.use(cors());

// 3. Body parser with strict 100kb limit
app.use(express.json({ limit: '100kb' }));

// 4. Rate Limiting for evaluation endpoints (60 req/min)
const evaluationRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
});

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
    description: 'TypeSafe Jev Playground API',
  });
});

/**
 * Questions discovery endpoint returning registered questions and state presets.
 */
app.get('/api/questions', defaultEvaluationHandlers.handleQuestionsListRequest);

/**
 * Evaluation execution endpoint.
 */
app.post('/api/evaluate', evaluationRateLimiter, defaultEvaluationHandlers.handleEvaluateRequest);

// 5. Sanitized Error Handler (must be last)
app.use(sanitizedErrorHandler);

// Start listener only when not running inside tests
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[TypeSafe Jev Playground API] Running on http://localhost:${PORT}`);
    console.log(`[Security] Zero-fallback BYOK enforcement active. Application-owner keys are disabled.`);
  });
}
