/**
 * OTP Controller — validates input, delegates to 2Factor service.
 */
const { sendOTP, verifyOTP } = require('../services/otpService');
const logger = require('../config/logger');

// Indian phone: exactly 10 digits, starts with 6-9
const PHONE_REGEX = /^[6-9]\d{9}$/;

// ─── POST /otp/send-otp ─────────────────────────────────
async function handleSendOTP(req, res) {
  try {
    let { phone } = req.body;

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    // Strip +91, spaces, dashes
    phone = phone.replace(/^\+91/, '').replace(/[\s\-()]/g, '');

    if (!PHONE_REGEX.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number. Enter a 10-digit Indian mobile number.',
      });
    }

    const result = await sendOTP(phone);

    return res.json({
      success: true,
      message: `OTP sent to ${phone}`,
      session_id: result.sessionId,
    });
  } catch (err) {
    logger.error('[Controller] sendOTP error:', err.message);
    return res.status(500).json({ success: false, error: err.message || 'Failed to send OTP' });
  }
}

// ─── POST /otp/verify-otp ───────────────────────────────
async function handleVerifyOTP(req, res) {
  try {
    const { session_id, otp } = req.body;

    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({ success: false, error: 'session_id is required' });
    }

    if (!otp || typeof otp !== 'string' || !/^\d{4,6}$/.test(otp.trim())) {
      return res.status(400).json({ success: false, error: 'OTP must be 4–6 digits' });
    }

    const result = await verifyOTP(session_id, otp.trim());

    return res.json({
      success: true,
      valid: result.valid,
      message: result.valid ? 'Phone verified successfully' : 'Invalid or expired OTP',
      details: result.details,
    });
  } catch (err) {
    logger.error('[Controller] verifyOTP error:', err.message);
    return res.status(500).json({ success: false, error: err.message || 'Verification failed' });
  }
}

module.exports = { handleSendOTP, handleVerifyOTP };
