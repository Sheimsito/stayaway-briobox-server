import type { Request, Response } from "express";
import { UserDAO, userDAO } from "../dao/userDAO.js";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config/config.js";
import { sendMail } from "../service/resendService.js";
import { generateEmailTemplate, type TemplateVariables } from "../service/emailTemplates.js";

interface RegisterRequest {
    name: string;
    lastName: string;
    age: number;
    email: string;
    password: string;
}


interface LoginRequest {
    email: string;
    password: string;
}

/**
 * Logs in a user and returns a token.
 *
 * @async
 * @function login
 * @param {import('express').Request} req Express HTTP request object.
 * @param {import('express').Response} res Express HTTP response object.
 * @returns {Promise<void>} Does not return directly; sends a JSON response.
 */
const login = async (req: Request<{}, {}, LoginRequest>, res: Response) => {
    try {
        const { email, password } = req.body;     
        switch(true) {
            case !email:
                return res.status(400).json({ message: "El correo es obligatorio." });
            case !password:
                return res.status(400).json({ message: "La contraseña es obligatoria." });
        }   
        const user = await userDAO.findByEmail(email);     
        if(!user) {
            return res.status(401).json({ message: "Correo o contraseña incorrectos." });
        }
        if (user.is_deleted) {
            return res.status(403).json({ message: "Tu cuenta está deshabilitada." });
        }

        const isPasswordValid: boolean = await bcrypt.compare(password, user.password);
        if(!isPasswordValid) {
            return res.status(401).json({ message: "Correo o contraseña incorrectos." });      
        }

        const token: string = jwt.sign(
            { userId: user.id }, 
            config.jwtSecret, 
            { expiresIn: "24h" } // 24 hours
        );
   
        // Adaptative Cookie
        res.cookie("access_token", token, 
                { 
                    httpOnly: false, 
                    secure: false,
                    sameSite: "lax", 
                    maxAge: 24 * 60 * 60 * 1000,  // 24 hours
                    path: "/"
                }
        ); 
        return res.status(200).json({ message: "Inicio de sesión exitoso.", token });

        

    } catch (error: unknown) {
      return res.status(500).json({ message: "Inténtalo más tarde.", error: error instanceof Error ? error.message : "Error interno del servidor"});
    }
}

// Logout

/**
 * Logs out a user and clears the cookie.
 *
 * @async
 * @function logout
 * @param {import('express').Request} req Express HTTP request object.
 * @param {import('express').Response} res Express HTTP response object.
 * @returns {Promise<void>} Does not return directly; sends a JSON response.
 */


const logout = async (req: Request , res: Response) => {
   try{
     const isProduction: boolean = config.nodeEnv === "production";
     res.clearCookie("access_token", {
        httpOnly: false,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/"
     });
     return res.status(200).json({ message: "Cierre de sesión exitoso." });
   } catch (error: unknown) {
    return res.status(500).json({ message: "Inténtalo más tarde.", error: error instanceof Error ? error.message : "Error interno del servidor"});
   }
}

interface ForgotPasswordRequest {
    email: string;
}
/**
 * Sends an email with a password reset link.
 *
 * @async
 * @function forgotPassword
 * @param {Request} req Express request object containing the user email.
 * @param {Response} res Express response object.
 * @returns {Promise<void>} Returns a JSON object with:
 *
 * - 200: `{ success: true, message: "Si el correo existe, se ha enviado un enlace de restablecimiento." }`
 *   If the process completes successfully.
 * - 202: `{ success: false, message: "Correo no registrado." }`
 *   If the email is not registered.
 * - 500: `{ success: false, message: err.message }`
 *   If an internal error occurs.
 */


const forgotPassword = async (req: Request<{}, {}, ForgotPasswordRequest>, res: Response) => {
    try {
      const { email } = req.body;
      const user = await userDAO.findByEmail(email);
      if (!user) {
        return res.status(202).json({ success: false, message: "Correo no registrado." });
      }
      const jwtid: string = Math.random().toString(36).substring(2);
      const resetToken: string = jwt.sign(
        { userId: user.id },
        config.jwtResetPasswordSecret,
        { expiresIn: '1h' , jwtid }
      );
  
      await userDAO.updateResetPasswordJti(String(user.id), jwtid);
  
      const resetLink: string = `${config.frontendUrl}/olvidar-pw2?token=${resetToken}`;
  
      // In development, send to verified Resend email (not production user emails)
      const emailToSend: string = config.emailToSend; // Right now it is set to the email of the dev team, but in the future it will be set to the email of the user who forgot their password
      
      // Prepare template variables
      const templateVariables: TemplateVariables = {
        APP_NAME: config.appName,
        LOGO_URL: config.logoUrl,
        SUPPORT_EMAIL: config.supportEmail,
        USER_NAME: user.name,
        RESET_URL: resetLink,
        EXPIRES_IN: "1 hora",
        CURRENT_YEAR: new Date().getFullYear().toString()
      };

      // Generate HTML email using template
      const htmlEmail = generateEmailTemplate('password-reset', templateVariables);
      
      // Generate plain text version
      const textEmail = `Hola ${user.name},c

        Recibimos una solicitud para restablecer la contraseña de tu cuenta en ${config.appName}.

        Si solicitaste este cambio, haz clic en el siguiente enlace:
        ${resetLink}

        Este enlace expira en 1 hora y solo puede usarse una vez.

        Si no solicitaste este cambio, ignora este email.

        Si tienes problemas, contacta nuestro soporte en ${config.supportEmail}

        ---
        ${config.appName}
        Este email fue generado automáticamente, por favor no responder.`;

      await sendMail({
          to: emailToSend,
          subject: `Recuperar Contraseña - ${config.appName}`,
          text: textEmail,
          html: htmlEmail,
      });
  
      res.status(200).json({ success: true, message: "Se ha enviado un enlace de restablecimiento." });
    } catch (err: unknown) {
      console.error('Error en forgotPassword:', err instanceof Error ? err.message : "Error interno del servidor");
      res.status(500).json({ success: false, message: err instanceof Error ? err.message : "Error interno del servidor"});
    }
  };

  interface ResetPasswordRequest {
    token: string;
    newPassword: string;
  }
  /**
 * Resets the user’s password using a JWT reset token.
 *
 * @async
 * @function resetPassword
 * @param {Request} req Express request object containing `token` and `newPassword`.
 * @param {Response} res Express response object.
 * @returns {Promise<void>} Returns a JSON object with:
 *
 * - 200: `{ success: true, message: "Contraseña actualizada." }`
 *   If the password was updated successfully.
 * - 400: `{ success: false, message: "Enlace inválido o ya utilizado." }`
 *   If the token is invalid, expired, or already used.
 * - 400: `{ success: false, message: "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial" }`
 *   If the new password does not meet security requirements.
 * - 500: `{ success: false, message: "Inténtalo de nuevo más tarde.", err: err.message }`
 *   If an internal error occurs.
 */
const resetPassword = async (req: Request<{}, {}, ResetPasswordRequest>, res: Response) => {
    try {
      const { token, newPassword} = req.body;
      const decoded: JwtPayload = jwt.verify(token, config.jwtResetPasswordSecret) as JwtPayload;
      const user = await userDAO.findById(decoded.userId);
      if(!user || user.resetPasswordJti !== decoded.jti){
          return res.status(400).json({ success: false, message: "Enlace inválido o ya utilizado." });
      }
  
      if(newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)){
          return res.status(400).json({ success: false, message: "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial" });
      }
  
      // Invalidate the token and update the password
      await userDAO.updateResetPasswordJti(String(user.id), "");
      await userDAO.updateById(user.id, { password: await bcrypt.hash(newPassword, 10) });

      // Send password changed notification email
      try {
        const emailToSend: string = config.emailToSend; // In development, send to dev team email
        
        const templateVariables: TemplateVariables = {
          APP_NAME: config.appName,
          LOGO_URL: config.logoUrl,
          SUPPORT_EMAIL: config.supportEmail,
          USER_NAME: user.name,
          CHANGED_DATE: new Date().toLocaleDateString('es-ES'),
          CHANGED_TIME: new Date().toLocaleTimeString('es-ES'),
          IP_ADDRESS: req.ip || req.connection.remoteAddress || 'Desconocida',
          CURRENT_YEAR: new Date().getFullYear().toString()
        };

        const htmlEmail = generateEmailTemplate('password-changed', templateVariables);
        
        const textEmail = `Hola ${user.name},

¡Contraseña actualizada con éxito en ${config.appName}!

Tu contraseña ha sido cambiada exitosamente.

Detalles del cambio:
- Fecha: ${templateVariables.CHANGED_DATE}
- Hora: ${templateVariables.CHANGED_TIME}
- IP aproximada: ${templateVariables.IP_ADDRESS}

¿No fuiste tú? Si no realizaste este cambio, contacta inmediatamente nuestro soporte en ${config.supportEmail}

---
${config.appName}
Mantén tu cuenta segura - Tu seguridad es nuestra prioridad`;

        await sendMail({
          to: emailToSend,
          subject: `Contraseña Actualizada - ${config.appName}`,
          text: textEmail,
          html: htmlEmail,
        });
      } catch (emailError) {
        console.error('Error enviando email de notificación:', emailError);
        // Don't fail the password reset if email fails
      }

      res.status(200).json({ success: true, message: "Contraseña actualizada." });
    } catch (err: unknown) {
      res.status(500).json({ success: false, message: "Inténtalo de nuevo más tarde." , err: err instanceof Error ? err.message : "Error interno del servidor"});
    }
  };

  /**
 * Verifies if the user is authenticated.
 *
 * @function verifyAuth
 * @param {Request} req Express request object (must include `req.user` from the `authenticateToken` middleware).
 * @param {Response} res Express response object.
 * @returns {void} Returns a JSON object with:
 *
 * - 200: `{ success: true, user: { id, email } }`
 *   If the user is authenticated.
 * - 401: Unauthorized (handled by `authenticateToken` middleware).
 * - 500: `{ success: false, message: error.message }`
 *   If an internal error occurs.
 */
const verifyAuth = async (req: Request, res: Response) => {
    try {
        // If we get here, the authenticateToken middleware has already verified that the token is valid
        res.status(200).json({
            success: true,
            user: {
                id: (req as Request & { user: { userId: string } }).user.userId
            }
        });
    } catch (error: unknown) {
        res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Error interno del servidor"});
    }
};

/**
 * Sends an account blocked notification email
 * @param user - User object
 * @param blockDuration - Duration of the block in minutes
 * @param ipAddress - IP address that triggered the block
 */
const sendAccountBlockedEmail = async (user: any, blockDuration: number, ipAddress: string) => {
  try {
    const emailToSend: string = config.emailToSend;
    const unblockTime = new Date(Date.now() + blockDuration * 60 * 1000).toLocaleString('es-ES');
    
    const templateVariables: TemplateVariables = {
      APP_NAME: config.appName,
      LOGO_URL: config.logoUrl,
      SUPPORT_EMAIL: config.supportEmail,
      USER_NAME: user.name,
      BLOCK_DURATION: blockDuration.toString(),
      UNBLOCK_TIME: unblockTime,
      IP_ADDRESS: ipAddress,
      CURRENT_YEAR: new Date().getFullYear().toString()
    };

    const htmlEmail = generateEmailTemplate('account-blocked', templateVariables);
    
    const textEmail = `Hola ${user.name},

🔒 Tu cuenta de ${config.appName} ha sido temporalmente bloqueada

Debido a múltiples intentos de login fallidos, tu cuenta ha sido bloqueada por seguridad.

Detalles del bloqueo:
- Tiempo restante: ${blockDuration} minutos
- Acceso restaurado: ${unblockTime}
- IP detectada: ${ipAddress}

Si no intentaste acceder a tu cuenta, es posible que alguien esté tratando de hacerlo sin autorización.

¿Qué puedes hacer?
- Esperar ${blockDuration} minutos antes de intentar nuevamente
- Usar la opción "Olvidé mi contraseña" si no recuerdas tu clave
- Contactar soporte si crees que esto es un error
- Revisar la seguridad de tu contraseña

Si necesitas ayuda, contacta nuestro soporte en ${config.supportEmail}

---
${config.appName}
Tu seguridad es nuestra prioridad - Equipo de Seguridad`;

    await sendMail({
      to: emailToSend,
      subject: `Alerta de Seguridad - ${config.appName}`,
      text: textEmail,
      html: htmlEmail,
    });
  } catch (error) {
    console.error('Error enviando email de cuenta bloqueada:', error);
  }
};

export default { login, logout, forgotPassword, resetPassword, verifyAuth, sendAccountBlockedEmail };