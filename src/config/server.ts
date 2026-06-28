import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import logger from "../middleware/logger.js";
import config from "./config.js";

const configureServer = (app: express.Application) => {
    const allowedOrigins: string[] = [
        config.frontendUrl, 
        "http://localhost:3000"].filter(Boolean);
   
    app.use(cors({
        origin: function (origin, callback) {
            // This is the list of allowed origins
            const allowedOrigins: string[] = [
                'http://localhost:3000',
                'http://localhost:5173', // Vite frontend dev server
                config.frontendUrl
            ].filter(Boolean);

            // Allow requests with no origin (like Postman, curl, etc.)
            if (!origin) return callback(null, true);

            // Check if the origin is in the allowed list
            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                // In development, allow all origins
                if (config.nodeEnv === 'development') {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization","Cookie","X-Requested-With","User-Agent","Accept"],
        exposedHeaders: ["Set-Cookie"],
        optionsSuccessStatus: 200,
        preflightContinue: false,
    }));
    
    // Handle OPTIONS requests not covered by CORS
    app.use((req: Request, res: Response, next: NextFunction) => {
        // Solo manejar OPTIONS si no fue manejado por CORS
        if (req.method=== 'OPTIONS') {
            res.sendStatus(200);
        } else {
            next();
        }
    });

    // Logging middleware
    app.use(logger);

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static files (opcional)
    app.use(express.static('public'));
}

export default configureServer;