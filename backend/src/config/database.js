const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

// Testar a ligação ao iniciar
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Erro ao ligar à base de dados:', err.message);
    } else {
        console.log('✅ Ligação à base de dados PostgreSQL estabelecida!');
        release();
    }
});

module.exports = pool;
