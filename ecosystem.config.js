module.exports = {
  apps: [{
    name: 'towerforms-backend',
    script: './dist/main.js',
    instances: 1,
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/towerforms/error.log',
    out_file: '/var/log/towerforms/out.log',
    log_file: '/var/log/towerforms/combined.log',
    time: true,
    max_memory_restart: '1G',
    autorestart: true,
    watch: false,
    merge_logs: true,
    env_file: '.env.production'
  }]
};
