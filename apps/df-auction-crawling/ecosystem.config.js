const path = require('path');
/**
 * need install dotenv globally
 * npm install -g dotenv
 */
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  apps: [
    {
      name: 'df-auction-crawling',
      script: './dist/main.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        NEOPLE_API_KEY: process.env.NEOPLE_API_KEY,
      },
      max_memory_restart: '2G',
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      time: true,
    },
  ],
};
