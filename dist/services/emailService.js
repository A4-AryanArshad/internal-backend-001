"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendClientDashboardEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Configure email transporter (hardcoded Gmail credentials)
const GMAIL_USER = 'aryanarshadlex5413@gmail.com';
const GMAIL_APP_PASSWORD = 'gpua cmsh kixf sadu'.replace(/\s/g, ''); // strip spaces for SMTP
const createTransporter = () => {
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
        console.warn('⚠️  Gmail credentials not configured. Emails will be logged to console only.');
        return {
            sendMail: async (options) => {
                console.log('\n📧 EMAIL WOULD BE SENT:');
                console.log('To:', options.to);
                console.log('Subject:', options.subject);
                console.log('---\n');
                return { messageId: 'dev-' + Date.now() };
            }
        };
    }
    return nodemailer_1.default.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: GMAIL_USER,
            pass: GMAIL_APP_PASSWORD,
        },
    });
};
const sendClientDashboardEmail = async (clientEmail, clientName, projectId, projectName) => {
    const transporter = createTransporter();
    const LOCAL_FRONTEND = 'http://localhost:5173';
    const DEPLOYED_FRONTEND = 'https://internal-frontend-two.vercel.app';
    const FRONTEND_URL = process.env.VERCEL === '1' ? DEPLOYED_FRONTEND : LOCAL_FRONTEND;
    const dashboardUrl = `${FRONTEND_URL}/client/${projectId}/dashboard`;
    // Log the dashboard link to console for easy access during development
    console.log('\n' + '='.repeat(80));
    console.log('📧 CLIENT DASHBOARD LINK (Email would be sent to:', clientEmail, ')');
    console.log('='.repeat(80));
    console.log('📋 Project:', projectName);
    console.log('👤 Client:', clientName);
    console.log('🔗 Dashboard URL:', dashboardUrl);
    console.log('🔗 Direct Project Link:', `${FRONTEND_URL}/client/${projectId}`);
    console.log('='.repeat(80) + '\n');
    const mailOptions = {
        from: `"Client Project Portal" <${GMAIL_USER}>`,
        to: clientEmail,
        subject: `Your Project Dashboard: ${projectName}`,
        html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background: #f3f4f6; }
            .container { max-width: 560px; margin: 0 auto; padding: 24px; }
            .card { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
            .header { background: #ea580c; padding: 24px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; color: #ffffff; }
            .content { padding: 28px 24px; background: #ffffff; color: #374151; }
            .content p { margin: 0 0 1rem; font-size: 15px; }
            .btn-wrap { text-align: center; margin: 24px 0; }
            .link-box { background: #f3f4f6; padding: 12px 14px; border-radius: 8px; word-break: break-all; font-size: 13px; color: #4b5563; margin: 16px 0; border: 1px solid #e5e7eb; }
            .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <h1>Your Project is Ready!</h1>
              </div>
              <div class="content">
                <p>Hi ${clientName},</p>
                <p>Great news! Your project <strong>${projectName}</strong> is now active.</p>
                <p>You can track your project progress, view updates, and see the status at any time using the link below:</p>
                <div class="btn-wrap">
                  <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 28px; background-color: #ea580c; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">View Project Dashboard</a>
                </div>
                <p>Or copy this link:</p>
                <div class="link-box">${dashboardUrl}</div>
                <p>This link is private and secure. Only you can access your project dashboard.</p>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `,
        text: `
      Hi ${clientName},

      Great news! Your project "${projectName}" is now active.

      You can track your project progress using this link:
      ${dashboardUrl}

      This link is private and secure. Only you can access your project dashboard.

      Best regards,
      Client Project Portal
    `,
    };
    try {
        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('   Message ID:', result.messageId);
        console.log('   To:', clientEmail);
        console.log('   Subject:', mailOptions.subject);
        return { success: true, messageId: result.messageId };
    }
    catch (error) {
        console.error('❌ Email send error:', error.message);
        if (error.code === 'EAUTH') {
            console.error('   Authentication failed. Please check your Gmail app password.');
        }
        else if (error.code === 'ECONNECTION') {
            console.error('   Connection failed. Please check your internet connection.');
        }
        return { success: false, error: error.message };
    }
};
exports.sendClientDashboardEmail = sendClientDashboardEmail;
