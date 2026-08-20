// email.service.js
const nodemailer = require('nodemailer');
const config = require('../config/env');

let transporter = null;

// Only create transporter if email credentials exist
if (config.EMAIL_HOST && config.EMAIL_USER && config.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: config.EMAIL_HOST,
    port: config.EMAIL_PORT,
    secure: config.EMAIL_PORT === 465,
    auth: {
      user: config.EMAIL_USER,
      pass: config.EMAIL_PASS,
    },
  });
}

const sendEmail = async (to, subject, html) => {
  if (!transporter) {
    console.log(`📧 Email would be sent to ${to}: ${subject}`);
    console.log(`Content: ${html}`);
    return { message: 'Email service not configured' };
  }

  const mailOptions = {
    from: config.EMAIL_FROM,
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
};

const sendVerificationEmail = async (email, token) => {
  const link = `${config.CLIENT_URL}/verify-email?token=${token}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>بدلها - Exchange It</h1></div>
        <div class="content">
          <h2>Welcome to بدلها!</h2>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${link}" class="button">Verify Email</a>
          <p>This link will expire in 24 hours.</p>
        </div>
        <div class="footer"><p>&copy; ${new Date().getFullYear()} بدلها. All rights reserved.</p></div>
      </div>
    </body>
    </html>
  `;
  return sendEmail(email, 'Verify Your Email - بدلها', html);
};

const sendPasswordResetEmail = async (email, token) => {
  const link = `${config.CLIENT_URL}/reset-password?token=${token}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #e74c3c; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background: #e74c3c; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>Reset Your Password</h1></div>
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>Click the button below to reset your password:</p>
          <a href="${link}" class="button">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
        </div>
        <div class="footer"><p>&copy; ${new Date().getFullYear()} بدلها. All rights reserved.</p></div>
      </div>
    </body>
    </html>
  `;
  return sendEmail(email, 'Reset Password - بدلها', html);
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };