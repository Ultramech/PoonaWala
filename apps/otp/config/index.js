require('dotenv').config();

const config = {
  twoFactor: {
    apiKey: process.env.TWOFACTOR_API_KEY,
    baseUrl: 'https://2factor.in/API/V1',
  },
  server: {
    port: parseInt(process.env.PORT, 10) || 3001,
    env: process.env.NODE_ENV || 'development',
  },
};

if (!config.twoFactor.apiKey) {
  console.error('❌  Missing TWOFACTOR_API_KEY in .env');
  process.exit(1);
}

module.exports = config;
