import dotenv from "dotenv";


dotenv.config();

// This is the interface for the config object
interface Config {
    port: number;
    nodeEnv: string;
    databaseUrl: string;
    serviceRoleKey: string;
    frontendUrl: string;
    apiVersion: string;
    apiPrefix: string;
    jwtSecret: string;
    jwtResetPasswordSecret: string;
    resendApiKey: string;
    emailToSend: string;
    appName: string;
    logoUrl: string;
    supportEmail: string;

}

// This is the config object
const config: Config = {
    port: parseInt(process.env.PORT || "3000"),
    nodeEnv: process.env.NODE_ENV || "development",
    databaseUrl: process.env.SUPABASE_URL || "", 
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    frontendUrl: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://real-frontend-url.com' : 'http://localhost:3000'), 
    apiVersion: process.env.API_VERSION || "v1",
    apiPrefix: ( process.env.API_PREFIX || '/api').replace(/\/$/, ''), // Remove trailing slash if present
    jwtSecret: process.env.JWT_SECRET || "your_jwt_secret",
    jwtResetPasswordSecret: process.env.JWT_RESET_PASSWORD_SECRET || "your_jwt_reset_password_secret",
    resendApiKey: process.env.RESEND_API_KEY || "",
    emailToSend: process.env.EMAIL_TO_SEND || "",
    appName: process.env.APP_NAME || "Airfilms",
    logoUrl: process.env.LOGO_URL || "https://air-films-fend.vercel.app/AirFilms.png",
    supportEmail: process.env.SUPPORT_EMAIL || "support@airfilms.com"
    
}

export default config;