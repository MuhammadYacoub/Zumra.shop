/**
 * Zumra.shop (زُمرة) — Production PM2 Ecosystem Cluster Configuration
 * Authors: Khaled (DevOps Lead) & Omar (Backend Lead)
 */
module.exports = {
  apps: [
    {
      name: 'zumra-shop-engine',
      script: './dist/index.js',
      instances: 'max',               // Spin up worker process per available CPU core
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',     // Auto-restart worker process if RAM exceeds 500MB
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        HOST: '0.0.0.0',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
        LOG_LEVEL: 'info',
      },
      // Structured log file management
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      combine_logs: true,
      listen_timeout: 8000,
      kill_timeout: 5000,
    },
  ],
};
