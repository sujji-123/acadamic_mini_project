// ============================================
// ZERO-COST DEV MODE OTP SERVICE
// ============================================
// Since this is an academic project, we use a mock OTP
// system to avoid real SMS/Email API costs.

// Generate a static dummy OTP for testing
export const generateOTP = () => {
  return '123456'; 
};

// Simulate sending the OTP
export const sendOTP = async (phone, email) => {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

  console.log('\n==================================================');
  console.log(`🔐 [MOCK OTP GENERATED]`);
  if (phone) console.log(`To Phone: ${phone}`);
  if (email) console.log(`To Email: ${email}`);
  console.log(`Your OTP Code is: ${otp}`);
  console.log('==================================================\n');

  // Return true so the verification route can continue
  return { otp, expiresAt };
};

// Export the dev OTP constant just in case your verification route uses it directly
export const DEV_OTP = '123456';