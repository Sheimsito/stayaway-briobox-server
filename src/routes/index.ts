import { Router } from "express";
import express from "express";
import routes from "./routes.js";

const router = Router();


/**
 * @route GET /health
 * @description Health check route to verify if the server is running.
 * @access Public
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Debug route to list all available routes
router.get('/debug/routes', (req, res) => {
    const routes = [];

    // This is a simplified version - in a real app you'd traverse the router stack
    const availableRoutes = [
        'GET /health',
        'GET /',
        'GET /users/profile',
        'PUT /users/profile',
        'DELETE /users/profile',
        'POST /auth/register',
        'POST /auth/login',
        'POST /auth/logout',
        'POST /auth/forgot-password',
        'POST /auth/reset-password',
    ];

    res.status(200).json({
        success: true,
        message: 'Rutas disponibles',
        apiPrefix: process.env.API_PREFIX || '/api',
        routes: availableRoutes.map(route => `${process.env.API_PREFIX || '/api'}${route}`)
    });
});

// Welcome route
router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: '¡Bienvenido a la API!',
        version: process.env.API_VERSION || 'v1',
        status: 'Servidor listo para desarrollo'
    });
});

// Use main routes
router.use('/', routes);
