/**
 * Email templates for various authentication-related emails
 * Uses placeholder variables that will be replaced with actual values
 */

export const emailTemplates: Record<string, string> = {
  'password-reset': `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperar Contraseña - {{APP_NAME}}</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f4f4f4; 
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .header { 
          background: #101010ff; 
          color: #ff0000ff;
          font-weight: 600;
          padding: 30px 20px; 
          text-align: center; 
        }
        .header-logo {
          max-width: 120px;
          height: auto;
          margin-bottom: 15px;
          padding: 10px;
        }
        .header h1 { 
          margin: 0; 
          font-size: 28px; 
          color: #ff4800ff;
          font-weight: 600; 
        }
        .header p { 
          margin: 10px 0 0; 
          opacity: 0.9; 
          font-size: 16px;
        }
        .content { 
          padding: 40px 30px; 
        }
        .content h2 { 
          color: #333; 
          margin-bottom: 20px; 
        }
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #790000ff 0%, #FF4500 100%); 
          color: #1A1A1A !important; 
          padding: 16px 32px; 
          text-decoration: none; 
          border-radius: 8px; 
          margin: 25px 0; 
          font-weight: 600;
          text-align: center;
          box-shadow: 0 4px 15px rgba(255, 140, 0, 0.3);
        }
        .button:hover { 
          opacity: 0.9; 
        }
        .warning { 
          background: #fff8e1; 
          border-left: 4px solid #ff0000ff; 
          padding: 20px; 
          margin: 25px 0; 
          border-radius: 4px; 
        }
        .footer { 
          padding: 30px; 
          text-align: center; 
          color: #666; 
          font-size: 14px; 
          background: #fafafa;
          border-top: 1px solid #eee;
        }
        .footer-logo {
          max-width: 80px;
          height: auto;
          margin-bottom: 15px;
          opacity: 0.7;
        }
        .url-box {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          padding: 15px;
          border-radius: 6px;
          word-break: break-all;
          font-family: monospace;
          font-size: 13px;
          margin: 20px 0;
        }
        @media (max-width: 600px) {
          .header-logo {
            max-width: 100px;
          }
          .content {
            padding: 30px 20px;
          }
          .button {
            padding: 14px 24px;
            font-size: 14px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="{{LOGO_URL}}" alt="{{APP_NAME}} Logo" class="header-logo" />
          <h1 style="color: white;">{{APP_NAME}}</h1>
          <p>Recuperación de Contraseña</p>
        </div>
        <div class="content">
          <h2>Hola {{USER_NAME}},</h2>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>{{APP_NAME}}</strong>.</p>
          <p>Si solicitaste este cambio, haz clic en el siguiente botón:</p>
          
          <div style="text-align: center;">
            <a href="{{RESET_URL}}" class="button">Restablecer Mi Contraseña</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Información importante:</strong>
            <ul>
              <li>Este enlace expira en <strong>{{EXPIRES_IN}}</strong></li>
              <li>Solo puede usarse una vez</li>
              <li>Si no solicitaste este cambio, ignora este email</li>
              <li>Nunca compartas este enlace con nadie</li>
            </ul>
          </div>
          
          <p><strong>¿El botón no funciona?</strong> Copia y pega este enlace en tu navegador:</p>
          <div class="url-box">{{RESET_URL}}</div>
          
          <p><small>Si tienes problemas, contacta nuestro soporte en <a href="mailto:{{SUPPORT_EMAIL}}">{{SUPPORT_EMAIL}}</a></small></p>
        </div>
        <div class="footer">
          <img src="{{LOGO_URL}}" alt="{{APP_NAME}}" class="footer-logo" />
          <p><strong>{{APP_NAME}}</strong></p>
          <p>Tu plataforma para la gestión de tu gimnasio</p>
          <p>Este email fue generado automáticamente, por favor no responder.</p>
          <p>&copy; {{CURRENT_YEAR}} - Todos los derechos reservados</p>
        </div>
      </div>
    </body>
    </html>
  `
};

/**
 * Interface for template variables
 */
export interface TemplateVariables {
  APP_NAME: string;
  LOGO_URL: string;
  SUPPORT_EMAIL: string;
  USER_NAME: string;
  RESET_URL?: string;
  EXPIRES_IN?: string;
  CHANGED_DATE?: string;
  CHANGED_TIME?: string;
  IP_ADDRESS?: string;
  BLOCK_DURATION?: string;
  UNBLOCK_TIME?: string;
  CURRENT_YEAR?: string;
}

/**
 * Replaces template placeholders with actual values
 * @param template - The email template string
 * @param variables - Object containing the values to replace placeholders
 * @returns The template with all placeholders replaced
 */
export function replaceTemplateVariables(template: string, variables: TemplateVariables): string {
  let result = template;
  
  // Replace all placeholders with their corresponding values
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value || '');
  });
  
  return result;
}

/**
 * Generates a complete email template with variables replaced
 * @param templateName - Name of the template to use
 * @param variables - Variables to replace in the template
 * @returns Complete HTML email template
 */
export function generateEmailTemplate(templateName: keyof typeof emailTemplates, variables: TemplateVariables): string {
  const template = emailTemplates[templateName];
  if (!template) {
    throw new Error(`Template '${templateName}' not found`);
  }
  
  return replaceTemplateVariables(template, variables);
}
