/**
 * PM2 — Gestor de processos para produção
 * Instalar: npm install -g pm2
 * Iniciar:  pm2 start ecosystem.config.js
 * Parar:    pm2 stop kuphassana-api
 * Logs:     pm2 logs kuphassana-api
 */
module.exports = {
    apps: [{
        name:         'kuphassana-api',
        script:       'src/server.js',
        instances:    1,
        autorestart:  true,
        watch:        false,
        max_memory_restart: '300M',
        env: {
            NODE_ENV: 'development',
            PORT:     3000,
        },
        env_production: {
            NODE_ENV: 'production',
            PORT:     3000,
        },
        error_file:   'logs/error.log',
        out_file:     'logs/output.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss',
    }]
};
