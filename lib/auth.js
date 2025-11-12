// FILE: lib/auth.js
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
);

/**
 * Sign a JWT token
 * @param {Object} payload - User data to encode
 * @returns {Promise<string>} JWT token
 */
export async function signToken(payload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 days expiration
    .sign(JWT_SECRET);

  return token;
}

/**
 * Generate JWT token (alias for signToken for backward compatibility)
 * @param {Object} payload - User data to encode
 * @returns {Promise<string>} JWT token
 */
export async function generateToken(payload) {
  return await signToken(payload);
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Promise<Object>} Decoded payload
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Extract token from request cookies
 * @param {Request} request - Next.js request object
 * @returns {string|null} Token or null
 */
export function getTokenFromRequest(request) {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map(c => c.split('='))
  );

  return cookies['healway-auth-token'] || null;
}

/**
 * Middleware helper to verify authentication
 * @param {Request} request - Next.js request object
 * @returns {Promise<Object|null>} User data or null
 */
export async function getAuthUser(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return null;

    const user = await verifyToken(token);
    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Generate 6-digit OTP
 * @returns {string} OTP
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash OTP for secure storage
 * @param {string} otp - OTP to hash
 * @returns {Promise<string>} Hashed OTP
 */
export async function hashOTP(otp) {
  return await bcrypt.hash(otp, 10);
}

/**
 * Verify OTP against hashed version
 * @param {string} otp - Plain OTP
 * @param {string} hashedOTP - Hashed OTP
 * @returns {Promise<boolean>} True if valid
 */
export async function verifyOTP(otp, hashedOTP) {
  return await bcrypt.compare(otp, hashedOTP);
}

/**
 * Hash password
 * @param {string} password - Plain password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Compare password with hash
 * @param {string} password - Plain password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} True if valid
 */
export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}