/**
 * 2Factor.in OTP Service
 * Docs: https://2factor.in/CP/APIUsage
 */
const config = require('../config');
const logger = require('../config/logger');

const { apiKey, baseUrl } = config.twoFactor;

/**
 * Send OTP to an Indian phone number.
 * GET https://2factor.in/API/V1/{API_KEY}/SMS/{PHONE}/AUTOGEN
 *
 * @param {string} phone — 10-digit Indian number (no +91 prefix)
 * @returns {Promise<{sessionId: string, status: string}>}
 */
async function sendOTP(phone) {
  const url = `${baseUrl}/${apiKey}/SMS/${phone}/AUTOGEN`;
  logger.info(`[2Factor] Sending OTP → ${phone}`);

  const res = await fetch(url);
  const data = await res.json();

  if (data.Status !== 'Success') {
    logger.error(`[2Factor] Send failed: ${data.Details}`);
    throw new Error(data.Details || 'Failed to send OTP');
  }

  logger.info(`[2Factor] OTP sent — session: ${data.Details}`);
  return {
    sessionId: data.Details,   // 2Factor returns session ID in Details
    status: data.Status,
  };
}

/**
 * Verify OTP code.
 * GET https://2factor.in/API/V1/{API_KEY}/SMS/VERIFY/{SESSION_ID}/{OTP}
 *
 * @param {string} sessionId — from sendOTP response
 * @param {string} otp — user-entered code
 * @returns {Promise<{valid: boolean, status: string, details: string}>}
 */
async function verifyOTP(sessionId, otp) {
  const url = `${baseUrl}/${apiKey}/SMS/VERIFY/${sessionId}/${otp}`;
  logger.info(`[2Factor] Verifying OTP for session ${sessionId}`);

  const res = await fetch(url);
  const data = await res.json();

  const valid = data.Details === 'OTP Matched';
  logger.info(`[2Factor] Verify result: ${data.Details} (valid: ${valid})`);

  return {
    valid,
    status: data.Status,
    details: data.Details,
  };
}

module.exports = { sendOTP, verifyOTP };
