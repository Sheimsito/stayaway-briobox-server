import express, { Request, Response } from "express";
import indexRoutes from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";
import notFound from "./middleware/notFound.js";
import cookieParser from "cookie-parser";
import config from "./config/config.js";
import configureServer from "./config/server.js";
import { initCronJobs } from "./jobs/cronJobs.js";

// initialize the express app
const app = express();

app.set('trust proxy', 1);
// configure the server
configureServer(app);

app.use(cookieParser());

// Root route for Render health checks
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'BrioBox API - Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        apiBase: `${req.protocol}://${req.get('host')}${config.apiPrefix}`,
        version: config.apiVersion || 'v1'
    });
});

// use the user routes
app.use(`${config.apiPrefix}`, indexRoutes);

// use the not found middleware
app.use(notFound);
// use the error handler middleware
app.use(errorHandler);

const PORT: number = config.port || 3000;

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
    console.log(`📱 API disponible en: http://localhost:${PORT}`);
    console.log(`🌍 Entorno: ${config.nodeEnv}`);
    console.log(`📚 API Base: http://localhost:${PORT}${config.apiPrefix}`);
    console.log(`🔧 API_PREFIX configurado como: "${config.apiPrefix}"`);
    console.log(`🔧 NODE_ENV: ${config.nodeEnv}`);
    console.log(`🔧 API_VERSION: ${config.apiVersion}`);

    // Inicializar cron jobs de email
    initCronJobs();
});

export default app;