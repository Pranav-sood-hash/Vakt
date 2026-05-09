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

module.exports = {
  generateOTP,
  sendEmailChangeOTP,
  sendPasswordChangeOTP
};
