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
    appName: process.env.APP_NAME || "BrioBox",
    logoUrl: process.env.LOGO_URL || "https://instagram.fclo12-1.fna.fbcdn.net/v/t51.82787-19/622439008_18189881377345639_7755046128322320629_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xMDgwLmMyIn0&_nc_ht=instagram.fclo12-1.fna.fbcdn.net&_nc_cat=107&_nc_oc=Q6cZ2gHGN10EsPjZO86ElY2bTnKruXgfpNdctkv9HVdrsN07rlEUVjqW7TnYD0dUGJ6iE6hPr7mVR6qPDUKjeU4f8xY3&_nc_ohc=gsIj1RxH6H8Q7kNvwHrW1GN&_nc_gid=2KdjvupR-1WcVvoPU8I-OA&edm=AP4sbd4BAAAA&ccb=7-5&oh=00_Af483J6mt24BLYHstCUkOdwTG6UxAxyA-S5tgIcSFx9yVQ&oe=6A06C10A&_nc_sid=7a9f4b",
    supportEmail: process.env.SUPPORT_EMAIL || "support@briobox.com"
    
}

export default config;