const nodemailer = require('nodemailer');
const appConfig = require('../config/env');
const { resolveEmailConfig, getTransportOptions } = require('../config/email');

let transporter = null;
const emailConfig = resolveEmailConfig();

if (emailConfig.configured) {
  transporter = nodemailer.createTransport(getTransportOptions(emailConfig));

  console.info('[email] SMTP transport configured', {
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.port === 465,
    authUserConfigured: true,
    senderConfigured: Boolean(emailConfig.from),
    environmentVariables: emailConfig.sources,
  });
  for (const { setting, source } of emailConfig.aliases) {
    console.warn('[email] Deprecated SMTP environment variable alias in use', {
      setting,
      source,
      preferred: setting,
    });
  }
  if (appConfig.NODE_ENV === 'production' && process.env.NODE_TEST_CONTEXT === undefined) {
    transporter.verify().then(() => {
      console.info('[email] SMTP connection verified');
    }).catch((error) => {
      console.error('[email] SMTP connection verification failed', {
        name: error.name,
        code: error.code,
        command: error.command,
        responseCode: error.responseCode,
        message: error.message,
      });
    });
  }
} else {
  console.error('[email] SMTP transport is disabled; configuration is incomplete or invalid', {
    missing: emailConfig.missing,
    invalid: emailConfig.invalid,
    aliasesDetected: emailConfig.aliases,
  });
}

const sendEmail = async (to, subject, html) => {
  if (!transporter) {
    console.error('[email] Cannot send email because SMTP is not configured', {
      missing: emailConfig.missing,
      invalid: emailConfig.invalid,
      subject,
    });
    throw new Error(emailConfig.invalid.length
      ? 'EMAIL_CONFIGURATION_INVALID'
      : 'EMAIL_SERVICE_NOT_CONFIGURED');
  }

  const mailOptions = {
    from: emailConfig.from,
    to,
    subject,
    html,
  };

  console.info('[email] Sending email', {
    host: emailConfig.host,
    port: emailConfig.port,
    subject,
  });

  try {
    const result = await transporter.sendMail(mailOptions);
    console.info('[email] Email accepted by SMTP transport', {
      messageId: result.messageId,
      acceptedCount: Array.isArray(result.accepted) ? result.accepted.length : 0,
      rejectedCount: Array.isArray(result.rejected) ? result.rejected.length : 0,
    });
    return result;
  } catch (error) {
    console.error('[email] SMTP send failed', {
      name: error.name,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      message: error.message,
    });
    throw new Error('EMAIL_DELIVERY_FAILED', { cause: error });
  }
};

const sendVerificationEmail = async (email, token) => {
  const link = `${appConfig.CLIENT_URL.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(token)}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background: #3498db; 
          color: white; 
          text-decoration: none; 
          border-radius: 4px;
          margin: 20px 0;
        }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>بدلها - Exchange It</h1>
        </div>
        <div class="content">
          <h2>Welcome to بدلها!</h2>
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <a href="${link}" class="button">Verify Email</a>
          <p>Or copy and paste this link in your browser:</p>
          <p><a href="${link}">${link}</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} بدلها. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail(email, 'Verify Your Email - بدلها', html);
};

const sendPasswordResetEmail = async (email, token) => {
  const link = `${appConfig.CLIENT_URL.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #e74c3c; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background: #e74c3c; 
          color: white; 
          text-decoration: none; 
          border-radius: 4px;
          margin: 20px 0;
        }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          <a href="${link}" class="button">Reset Password</a>
          <p>Or copy and paste this link in your browser:</p>
          <p><a href="${link}">${link}</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} بدلها. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail(email, 'Reset Password - بدلها', html);
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };
