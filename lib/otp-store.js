// FILE: lib/otp-store.js
/**
 * In-memory OTP store
 * ⚠️ PRODUCTION: Replace with Redis or database
 */
export const otpStore = new Map();

/**
 * Store OTP with expiry
 */
export function storeOTP(mobileNumber, data) {
  otpStore.set(mobileNumber, {
    ...data,
    createdAt: Date.now(),
  });
}

/**
 * Get OTP data
 */
export function getOTP(mobileNumber) {
  return otpStore.get(mobileNumber);
}

/**
 * Delete OTP
 */
export function deleteOTP(mobileNumber) {
  otpStore.delete(mobileNumber);
}

/**
 * Clear expired OTPs (cleanup job)
 */
export function clearExpiredOTPs() {
  const now = Date.now();
  for (const [mobile, data] of otpStore.entries()) {
    if (data.expiresAt < now) {
      otpStore.delete(mobile);
    }
  }
}

// Run cleanup every minute
if (typeof setInterval !== 'undefined') {
  setInterval(clearExpiredOTPs, 60 * 1000);
}