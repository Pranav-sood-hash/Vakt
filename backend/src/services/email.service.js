const nodemailer = require('nodemailer');

console.log('--- Email Service Init ---');
console.log('SMTP_USER:', process.env.SMTP_USER ? `${process.env.SMTP_USER.slice(0, 3)}...` : 'undefined');
console.log('SMTP_PASS length:', process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,     // your Gmail address
    pass: process.env.SMTP_PASS,     // Gmail App Password
  }
});

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send Email Change Verification
const sendEmailChangeOTP = async (toEmail, otp) => {
  await transporter.sendMail({
    from: `"Vakt App" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Vakt — Verify Your New Email Address',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #f5f6fa; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2D4FD6; font-size: 28px; margin: 0;">Vakt</h1>
          <p style="color: #666; margin: 4px 0 0;">Stay Disciplined</p>
        </div>
        <h2 style="color: #1a1a2e; font-size: 20px;">Verify Your New Email</h2>
        <p style="color: #444; line-height: 1.6;">
          You requested to change your email address. Use the code below to verify your new email.
        </p>
        <div style="background: #fff; border: 2px solid #2D4FD6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="color: #666; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
          <h1 style="color: #2D4FD6; font-size: 42px; letter-spacing: 12px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #888; font-size: 13px;">This code expires in <strong>10 minutes</strong>. If you did not request this change, ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #aaa; font-size: 12px; text-align: center;">© 2024 Vakt · Stay Disciplined</p>
      </div>
    `
  });
};

// Send Password Change Verification
const sendPasswordChangeOTP = async (toEmail, userName, otp) => {
  await transporter.sendMail({
    from: `"Vakt App" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Vakt — Verify Your Password Change',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #f5f6fa; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2D4FD6; font-size: 28px; margin: 0;">Vakt</h1>
          <p style="color: #666; margin: 4px 0 0;">Stay Disciplined</p>
        </div>
        <h2 style="color: #1a1a2e; font-size: 20px;">Password Change Request</h2>
        <p style="color: #444; line-height: 1.6;">
          Hi <strong>${userName}</strong>, we received a request to change your Vakt account password.
          Use the code below to verify it's you.
        </p>
        <div style="background: #fff; border: 2px solid #2D4FD6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="color: #666; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Security Code</p>
          <h1 style="color: #2D4FD6; font-size: 42px; letter-spacing: 12px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #888; font-size: 13px;">This code expires in <strong>10 minutes</strong>.</p>
        <p style="color: #e53935; font-size: 13px;">⚠️ If you did not request this, please secure your account immediately.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #aaa; font-size: 12px; text-align: center;">© 2024 Vakt · Stay Disciplined</p>
      </div>
    `
  });
};

// Send Forgot Password OTP
const sendForgotPasswordOTP = async (toEmail, userName, otp) => {
  await transporter.sendMail({
    from: `"Vakt App" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Vakt — Password Reset Verification Code',
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: auto; padding: 40px; background: #f5f6fa; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2D4FD6; font-size: 36px; font-weight: bold; margin: 0;">Vakt</h1>
          <p style="color: #666; margin: 8px 0 0;">Stay Disciplined</p>
        </div>
        
        <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #1a1a2e; font-size: 24px; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #444; line-height: 1.6; font-size: 16px;">
            Hi <strong>${userName}</strong>, we received a request to reset your Vakt password.
          </p>
          
          <div style="background: #f0f2fa; border-radius: 12px; padding: 32px; text-align: center; margin: 32px 0;">
            <p style="color: #666; font-size: 14px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">Verification Code</p>
            <h1 style="color: #2D4FD6; font-size: 42px; letter-spacing: 12px; margin: 0; font-family: monospace;">${otp}</h1>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-bottom: 24px;">This code expires in <strong>10 minutes</strong>.</p>
          
          <div style="background: #fff5f5; border-left: 4px solid #e53935; padding: 16px; margin-bottom: 24px;">
            <p style="color: #c62828; font-size: 14px; margin: 0; font-weight: bold;">
              ⚠️ If you didn't request this, your account may be at risk. Secure it immediately.
            </p>
          </div>
        </div>
        
        <p style="color: #aaa; font-size: 12px; text-align: center; margin-top: 32px;">
          © 2024 Vakt · Stay Disciplined
        </p>
      </div>
    `
  });
};

// Send Password Reset Success
const sendPasswordResetSuccess = async (toEmail, userName) => {
  const timestamp = new Date().toLocaleString('en-US', { 
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium'
  });
  
  await transporter.sendMail({
    from: `"Vakt App" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Vakt — Your Password Was Successfully Reset',
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: auto; padding: 40px; background: #f5f6fa; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2D4FD6; font-size: 36px; font-weight: bold; margin: 0;">Vakt</h1>
          <p style="color: #666; margin: 8px 0 0;">Stay Disciplined</p>
        </div>
        
        <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 6px solid #4caf50;">
          <h2 style="color: #1a1a2e; font-size: 24px; margin-top: 0;">Password Reset Successful</h2>
          <p style="color: #444; line-height: 1.6; font-size: 16px;">
            Hi <strong>${userName}</strong>, your Vakt account password was successfully changed.
          </p>
          
          <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              <strong>Changed at:</strong> ${timestamp}
            </p>
          </div>
          
          <p style="color: #e53935; font-size: 14px; font-weight: bold; margin-top: 24px;">
            ⚠️ If you did not make this change, contact support immediately.
          </p>
        </div>
        
        <p style="color: #aaa; font-size: 12px; text-align: center; margin-top: 32px;">
          © 2024 Vakt · Stay Disciplined
        </p>
      </div>
    `
  });
};

module.exports = {
  generateOTP,
  sendEmailChangeOTP,
  sendPasswordChangeOTP,
  sendForgotPasswordOTP,
  sendPasswordResetSuccess
};
