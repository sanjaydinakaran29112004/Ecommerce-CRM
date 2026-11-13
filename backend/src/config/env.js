const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file (supports running from root or backend directory)
const possibleEnvPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env')
];

for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const requiredEnvVars = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`\x1b[31m[CONFIG FATAL] Missing required environment variable: ${envVar}\x1b[0m`);
    process.exit(1);
  }
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongodb: {
    uri: process.env.MONGODB_URI
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
  },
  security: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10
  }
};

module.exports = config;

