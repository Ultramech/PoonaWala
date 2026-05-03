/**
 * GoldEye OTP Service — 2Factor.in
 *
 * POST /otp/send-otp     { phone: "9876543210" }
 * POST /otp/verify-otp   { session_id: "...", otp: "123456" }
 * GET  /health
 */
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const config  = require('./config');
const logger  = require('./config/logger');
const otpRoutes = require('./routes/otpRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static('public'));

app.use('/otp', otpRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'goldeye-otp', provider: '2factor.in' });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.listen(config.server.port, () => {
  logger.info(`🔐  OTP service (2Factor) running on http://localhost:${config.server.port}`);
  logger.info(`📱  Test UI: http://localhost:${config.server.port}/`);
});
