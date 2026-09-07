const { Pool } = require('pg');
require('dotenv').config();

// Render fornece DATABASE_URL, desenvolvimento usa variáveis separadas
const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Obrigatório no Render
    })
    : new Pool({
        host:     process.env.DB_HOST,
        port:     process.env.DB_PORT,
        database: process.env.DB_NAME,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Erro ao ligar à base de dados:', err.message);
    } else {
        console.log('✅ Ligação à base de dados PostgreSQL estabelecida!');
        release();
    }
});

module.exports = pool;
