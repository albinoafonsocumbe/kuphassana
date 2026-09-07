const pool = require('./src/config/database');
async function migrar() {
    try {
        await pool.query('ALTER TABLE servicos ADD COLUMN IF NOT EXISTS imagem_url VARCHAR(500)');
        console.log('✅ Coluna imagem_url adicionada');
        await pool.query('ALTER TABLE servicos ADD COLUMN IF NOT EXISTS imagens TEXT[]');
        console.log('✅ Coluna imagens adicionada');
    } catch(e) {
        console.log('Info:', e.message);
    } finally {
        await pool.end();
    }
}
migrar();
