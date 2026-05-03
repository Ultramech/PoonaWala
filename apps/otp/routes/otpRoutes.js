const { Router } = require('express');
const { handleSendOTP, handleVerifyOTP } = require('../controllers/otpController');

const router = Router();

router.post('/send-otp', handleSendOTP);
router.post('/verify-otp', handleVerifyOTP);

module.exports = router;
