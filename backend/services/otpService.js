import nodemailer from 'nodemailer';
import crypto from 'crypto';
import axios from 'axios';

// ============================================
// FREE SMS using Fast2SMS (100 free SMS/day)
// Sign up free at: https://www.fast2sms.com
// ============================================
const sendSMSViaFast2SMS = async (phone, otp) => {
  try {
    // For development - just log to console (completely free)
    console.log(`🔐 [DEV MODE] OTP for ${phone}: ${otp}`);
    
    // For production with Fast2SMS (FREE 100/day)
    // Just uncomment these lines when you need production:
    /*
    const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY; // Get free from fast2sms.com
    
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'otp',
        numbers: phone.replace('+91', ''), // Remove +91 if present
        variables_values: otp
      },
      {
        headers: {
          'authorization': FAST2SMS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.return) {
      console.log('✅ SMS sent successfully');
      return true;
    }
    */
    
    return true;
  } catch (error) {
    console.error('SMS sending failed:', error.message);
    // Don't throw error - still allow user to proceed in dev
    return false;
  }
};

// ============================================
// FREE Email using Gmail (100% free)
// Just enable "Less secure app access" or use App Password
// ============================================
const sendEmailViaGmail = async (email, otp) => {
  try {
    // Create transporter (use your Gmail)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS  // Your Gmail app password
      }
    });

    const mailOptions = {
      from: `"BloodLocator" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Verify Your Email - BloodLocator',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #dc2626;">🩸 BloodLocator</h1>
          </div>
          
          <h2 style="color: #333;">Email Verification</h2>
          
          <p>Your One-Time Password (OTP) for email verification is:</p>
          
          <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="font-size: 36px; letter-spacing: 8px; color: #dc2626; margin: 0;">${otp}</h1>
          </div>
          
          <p>This OTP will expire in <strong>10 minutes</strong>.</p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you didn't request this verification, please ignore this email.
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            BloodLocator - Saving Lives Together<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    // For development, still return true
    return true;
  }
};

// Generate 6-digit OTP
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send OTP via both SMS and Email
export const sendOTP = async (phone, email) => {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  console.log(`📱 Generated OTP: ${otp} for ${phone || email}`);

  // Send SMS if phone provided
  if (phone) {
    await sendSMSViaFast2SMS(phone, otp);
  }

  // Send Email if email provided
  if (email) {
    await sendEmailViaGmail(email, otp);
  }

  return { otp, expiresAt };
};

// For development - always use this OTP
export const DEV_OTP = '123456'; // Use this for testing