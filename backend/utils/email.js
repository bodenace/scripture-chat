/**
 * Email Utility
 * Handles sending emails for password reset, etc.
 */

const nodemailer = require('nodemailer');

/**
 * Create email transporter based on environment
 */
const createTransporter = () => {
  // For production, use a real email service (SendGrid, Mailgun, AWS SES, etc.)
  // For development, you can use Ethereal (fake SMTP) or your Gmail
  
  if (process.env.NODE_ENV === 'production') {
    // Production: Use configured SMTP settings
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Development: Use Gmail or Ethereal
    // For Gmail, enable "Less secure app access" or use App Password
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
    
    // Fallback: Log email to console (no actual email sent)
    return {
      sendMail: async (options) => {
        console.log('========== EMAIL (Development Mode) ==========');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('Body:', options.text || options.html);
        console.log('==============================================');
        return { messageId: 'dev-mode-no-email-sent' };
      }
    };
  }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - Password reset token
 * @param {string} frontendUrl - Frontend URL for reset link
 */
const sendPasswordResetEmail = async (email, resetToken, frontendUrl) => {
  const transporter = createTransporter();
  
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"ScriptureChat" <noreply@scripturechat.com>',
    to: email,
    subject: 'Reset Your ScriptureChat Password',
    text: `
Hello,

You requested to reset your password for your ScriptureChat account.

Please click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

Blessings,
The ScriptureChat Team

"Trust in the LORD with all your heart and lean not on your own understanding." - Proverbs 3:5
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Georgia, serif; line-height: 1.6; color: #1e3a5f; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #d4a574; }
    .header h1 { color: #1e3a5f; margin: 0; }
    .content { padding: 30px 0; }
    .button { 
      display: inline-block; 
      background-color: #1e3a5f; 
      color: white !important; 
      padding: 15px 30px; 
      text-decoration: none; 
      border-radius: 8px;
      font-size: 18px;
      margin: 20px 0;
    }
    .button:hover { background-color: #2d4a6f; }
    .footer { 
      padding-top: 20px; 
      border-top: 1px solid #e5e5e5; 
      font-size: 14px; 
      color: #666;
      text-align: center;
    }
    .verse { font-style: italic; color: #8b6914; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✝ ScriptureChat</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>You requested to reset your password for your ScriptureChat account.</p>
      <p>Please click the button below to reset your password:</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </p>
      <p><strong>This link will expire in 1 hour.</strong></p>
      <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      <p>Blessings,<br>The ScriptureChat Team</p>
      <p class="verse">"Trust in the LORD with all your heart and lean not on your own understanding." - Proverbs 3:5</p>
    </div>
    <div class="footer">
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p>${resetUrl}</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  };
  
  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = {
  sendPasswordResetEmail
};
