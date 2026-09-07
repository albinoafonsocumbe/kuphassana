const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware que verifica se o token JWT é válido.
 * Adiciona req.utilizador com os dados do token se válido.
 */
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    // O header deve vir no formato: "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            sucesso: false,
            mensagem: 'Acesso negado. Token não fornecido.'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const dados = jwt.verify(token, process.env.JWT_SECRET);
        req.utilizador = dados; // { id, email, papel }
        next();
    } catch (erro) {
        return res.status(401).json({
            sucesso: false,
            mensagem: 'Token inválido ou expirado.'
        });
    }
};

/**
 * Middleware para rotas exclusivas de administradores.
 * Deve ser usado DEPOIS de verificarToken.
 */
const apenasAdmin = (req, res, next) => {
    if (req.utilizador?.papel !== 'admin') {
        return res.status(403).json({
            sucesso: false,
            mensagem: 'Acesso restrito a administradores.'
        });
    }
    next();
};

module.exports = { verificarToken, apenasAdmin };
