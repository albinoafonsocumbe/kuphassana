/**
 * reset.js — Apagar e recriar todas as tabelas
 * Executar: node database/reset.js
 */
const pool = require('../src/config/database');

async function reset() {
    console.log('⚠️  A apagar tabelas antigas...\n');
    try {
        await pool.query(`
            DROP TABLE IF EXISTS contactos  CASCADE;
            DROP TABLE IF EXISTS servicos   CASCADE;
            DROP TABLE IF EXISTS categorias CASCADE;
            DROP TABLE IF EXISTS administradores CASCADE;
            DROP TABLE IF EXISTS empresa    CASCADE;
            DROP TABLE IF EXISTS pedidos    CASCADE;
            DROP TABLE IF EXISTS clientes   CASCADE;
            DROP TABLE IF EXISTS prestadores CASCADE;
        `);
        console.log('✅ Tabelas apagadas\n');
        console.log('▶  A correr setup...\n');
    } catch (e) {
        console.error('❌', e.message);
    } finally {
        await pool.end();
    }
}
reset().then(() => {
    const { execSync } = require('child_process');
    execSync('node database/setup.js', { stdio: 'inherit', cwd: __dirname + '/..' });
});
