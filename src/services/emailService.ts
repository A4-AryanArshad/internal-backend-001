import nodemailer from 'nodemailer'

// Configure email transporter (hardcoded Gmail credentials)
const GMAIL_USER = 'aryanarshadlex5413@gmail.com'
const GMAIL_APP_PASSWORD = 'gpua cmsh kixf sadu'.replace(/\s/g, '') // strip spaces for SMTP

const createTransporter = () => {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.warn('⚠️  Gmail credentials not configured. Emails will be logged to console only.')
    return {
      sendMail: async (options: any) => {
        console.log('\n📧 EMAIL WOULD BE SENT:')
        console.log('To:', options.to)
        console.log('Subject:', options.subject)
        console.log('---\n')
        return { messageId: 'dev-' + Date.now() }
      }
    }
  }

  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  })
}

export const sendClientDashboardEmail = async (
  clientEmail: string,
  clientName: string,
  projectId: string,
  projectName: string
) => {
  const transporter = createTransporter()
  const LOCAL_FRONTEND = 'http://localhost:5173'
  const DEPLOYED_FRONTEND = 'https://internal-frontend-two.vercel.app'
  const FRONTEND_URL = process.env.VERCEL === '1' ? DEPLOYED_FRONTEND : LOCAL_FRONTEND
  const dashboardUrl = `${FRONTEND_URL}/client/${projectId}/dashboard`

  // Log the dashboard link to console for easy access during development
  console.log('\n' + '='.repeat(80))
  console.log('📧 CLIENT DASHBOARD LINK (Email would be sent to:', clientEmail, ')')
  console.log('='.repeat(80))
  console.log('📋 Project:', projectName)
  console.log('👤 Client:', clientName)
  console.log('🔗 Dashboard URL:', dashboardUrl)
  console.log('🔗 Direct Project Link:', `${FRONTEND_URL}/client/${projectId}`)
  console.log('='.repeat(80) + '\n')

  const mailOptions = {
    from: `"Client Project Portal" <${GMAIL_USER}>`,
    to: clientEmail,
    subject: `Your Project Dashboard: ${projectName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1d4ed8; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #1d4ed8; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Project is Ready!</h1>
            </div>
            <div class="content">
              <p>Hi ${clientName},</p>
              <p>Great news! Your project <strong>${projectName}</strong> is now active.</p>
              <p>You can track your project progress, view updates, and see the status at any time using the link below:</p>
              <p style="text-align: center;">
                <a href="${dashboardUrl}" class="button">View Project Dashboard</a>
              </p>
              <p>Or copy this link:</p>
              <p style="background: #e5e7eb; padding: 10px; border-radius: 4px; word-break: break-all;">
                ${dashboardUrl}
              </p>
              <p>This link is private and secure. Only you can access your project dashboard.</p>
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
  }

  try {
    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Email sent successfully!')
    console.log('   Message ID:', result.messageId)
    console.log('   To:', clientEmail)
    console.log('   Subject:', mailOptions.subject)
    return { success: true, messageId: result.messageId }
  } catch (error: any) {
    console.error('❌ Email send error:', error.message)
    if (error.code === 'EAUTH') {
      console.error('   Authentication failed. Please check your Gmail app password.')
    } else if (error.code === 'ECONNECTION') {
      console.error('   Connection failed. Please check your internet connection.')
    }
    return { success: false, error: error.message }
  }
}

