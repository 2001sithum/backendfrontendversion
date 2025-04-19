import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import { initializeDatabase, closeDb } from './config/database';
import authRoutes from './routes/auth';

dotenv.config();

const startServer = async () => {
    try {
        await initializeDatabase();
        const app: Express = express();

        // Security middleware
        app.use(helmet({ contentSecurityPolicy: false }));
        app.use(cors({
            origin: process.env.FRONTEND_URL || 'http://localhost:5180',
            credentials: true
        }));
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(cookieParser());

        // Rate limiting
        const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
        app.use(limiter);
        const authLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 10 });
        app.use('/api/auth/login', authLimiter);
        app.use('/api/auth/register', authLimiter);

        // CSRF setup
        const csrfSecret = process.env.CSRF_SECRET;
        if (!csrfSecret) throw new Error("CSRF_SECRET missing");
        const csrfProtection = csurf({
            cookie: {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            }
        });

        // Public route (no CSRF protection needed)
        // app.get('/', (req: Request, res: Response) => res.send('API running...'));

        // CSRF token endpoint (must be before general CSRF protection)
        app.get('/api/csrf-token', csrfProtection, (req: Request, res: Response) => {
            res.json({ csrfToken: req.csrfToken() });
        });

        // Apply CSRF protection to all routes that modify state
        app.use(csrfProtection);

        // Protected routes
        app.use('/api/auth', authRoutes);

        // Error handler
        app.use((err: any, req: Request, res: Response, next: NextFunction) => {
            console.error("Error:", err.code || err.message);
            if (err.code === 'EBADCSRFTOKEN') {
                res.status(403).json({ success: false, message: 'Invalid CSRF token' });
            } else {
                res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
            }
        });

        // Start server
        const PORT = process.env.PORT || 5008;
        const server = app.listen(PORT, () => console.log(`Server on port ${PORT}`));

        // Graceful shutdown
        const shutdown = (signal: string) => {
            console.log(`${signal} received. Shutting down...`);
            server.close(async () => {
                console.log('HTTP closed.');
                await closeDb();
                process.exit(0);
            });
            setTimeout(() => { console.error('Force shutdown'); process.exit(1); }, 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('unhandledRejection', (err: Error) => {
            console.error(`Unhandled Rejection: ${err.message}`);
            server.close(() => process.exit(1));
        });

    } catch (error) {
        console.error("FATAL: Server start failed:", error);
        process.exit(1);
    }
};

startServer();