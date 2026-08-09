import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler } from './middleware/error';
import { sendError, sendSuccess } from './utils/response';

const app = express();

// Security and Logging Middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, postman) or matching frontends
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  sendSuccess(res, { status: 'healthy', timestamp: new Date().toISOString() }, 'NEXORA API is online');
});

// API Routes
app.use('/api', routes);

// 404 handler for undefined routes
app.use('*', (req: Request, res: Response) => {
  sendError(res, `Route ${req.originalUrl} not found on this server`, 404);
});

// Centralized error handler
app.use(errorHandler);

export default app;
