# Guia de Deploy — Agência Funerária Kuphassana

## Opções de Hospedagem Recomendadas

### Opção 1 — VPS (Recomendado para Moçambique)
**Custo**: ~$5-10/mês | **Providers**: DigitalOcean, Hetzner, Vultr

### Opção 2 — Railway (Fácil, Gratuito para começar)
**URL**: https://railway.app

### Opção 3 — Render
**URL**: https://render.com

---

## Deploy no Railway (Mais Simples)

### 1. Preparar o repositório Git

```bash
# Na pasta raiz do projecto
git init
git add .
git commit -m "Agência Funerária Kuphassana - versão inicial"
```

### 2. Backend no Railway

1. Ir a https://railway.app → New Project → Deploy from GitHub
2. Seleccionar a pasta `backend`
3. Adicionar variáveis de ambiente:
   - `DB_HOST` → fornecido pelo Railway PostgreSQL
   - `DB_PORT` → 5432
   - `DB_NAME` → railway
   - `DB_USER` → postgres
   - `DB_PASSWORD` → gerado pelo Railway
   - `JWT_SECRET` → gerar em https://randomkeygen.com
   - `NODE_ENV` → production
   - `FRONTEND_URL` → URL do teu frontend

4. Adicionar PostgreSQL: + New → Database → PostgreSQL
5. O Railway liga automaticamente

### 3. Frontend no Railway / Netlify

**Netlify (mais simples para HTML estático):**

1. Ir a https://netlify.com → New site → Deploy manually
2. Arrastar a pasta `frontend` para o Netlify
3. URL gerada automaticamente: `https://xxx.netlify.app`
4. Actualizar `FRONTEND_URL` no backend

---

## Deploy num VPS (Ubuntu)

### 1. Configurar o servidor

```bash
# Actualizar
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalar PM2
sudo npm install -g pm2

# Instalar Nginx
sudo apt install -y nginx
```

### 2. Configurar a base de dados

```bash
sudo -u postgres psql
CREATE DATABASE kuphassana_prod;
CREATE USER kuphassana WITH PASSWORD 'SENHA_SEGURA';
GRANT ALL PRIVILEGES ON DATABASE kuphassana_prod TO kuphassana;
\q
```

### 3. Copiar os ficheiros

```bash
# No teu computador, fazer upload via SCP ou Git
scp -r backend/ usuario@SEU_IP:/var/www/kuphassana/
```

### 4. Configurar o backend

```bash
cd /var/www/kuphassana/backend
npm install --production
cp .env.production .env
nano .env  # Preencher com os valores reais

# Criar tabelas
node database/setup.js

# Iniciar com PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 5. Configurar Nginx (proxy reverso)

```nginx
# /etc/nginx/sites-available/kuphassana
server {
    listen 80;
    server_name kuphassana.co.mz www.kuphassana.co.mz;

    # Frontend (ficheiros estáticos)
    root /var/www/kuphassana/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Uploads (imagens)
    location /uploads {
        proxy_pass http://localhost:3000;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/kuphassana /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. HTTPS (SSL gratuito com Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d kuphassana.co.mz -d www.kuphassana.co.mz
```

---

## Actualizar o frontend para produção

Antes de fazer deploy do frontend, actualizar a URL da API:

```javascript
// frontend/js/api.js — linha 2
// Desenvolvimento:
const API_BASE = 'http://localhost:3000/api'

// Produção (Nginx proxy):
const API_BASE = '/api'

// Produção (domínio separado):
const API_BASE = 'https://api.kuphassana.co.mz/api'
```

---

## Lista de verificação antes do deploy

- [ ] Alterar a senha do admin (`admin@funeraria.pt` / `password`)
- [ ] Actualizar `.env` com dados reais da BD
- [ ] Gerar JWT_SECRET forte (32+ caracteres)
- [ ] Configurar domínio DNS
- [ ] Testar todos os formulários
- [ ] Verificar upload de imagens funciona
- [ ] Activar HTTPS

---

## Alterar a senha do admin

```bash
# Gerar novo hash da senha
node -e "const b=require('bcrypt');b.hash('NOVA_SENHA',10).then(h=>console.log(h))"

# Actualizar na base de dados
psql -d kuphassana_prod -c "UPDATE administradores SET senha_hash='HASH_GERADO' WHERE email='admin@funeraria.pt'"
```

---

## Suporte

Para questões técnicas relacionadas com este projecto, contactar o desenvolvedor.
