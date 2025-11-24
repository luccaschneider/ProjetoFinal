# Variáveis de Ambiente - Certificate Service

## Desenvolvimento (.env.development)

Crie um arquivo `.env.development` na raiz do projeto com:

```env
# Variáveis de Ambiente - Desenvolvimento
NODE_ENV=development

# Porta do servidor
PORT=3001

# IP permitido para CORS
ALLOWED_IP=localhost

# Configuração do Banco de Dados PostgreSQL
DB_HOST=localhost
DB_PORT=5433
DB_NAME=microsservicos_db
DB_USER=postgres
DB_PASSWORD=postgres

# URL do serviço Java (Backend)
JAVA_SERVICE_URL=http://localhost:8080
```

## Produção (.env.production)

Crie um arquivo `.env.production` na raiz do projeto com:

```env
# Variáveis de Ambiente - Produção
NODE_ENV=production

# Porta do servidor
PORT=3001

# IP permitido para CORS
ALLOWED_IP=177.44.248.82

# Configuração do Banco de Dados PostgreSQL
DB_HOST=localhost
DB_PORT=5433
DB_NAME=microsservicos_db
DB_USER=postgres
DB_PASSWORD=postgres

# URL do serviço Java (Backend)
JAVA_SERVICE_URL=http://177.44.248.82:8080
```

## Fallback (.env)

Se os arquivos específicos não existirem, o sistema tentará carregar um arquivo `.env` genérico.

## Como Funciona

- **`npm run dev`**: Define `NODE_ENV=development` e carrega `.env.development` ou `.env`
- **`npm start`**: Define `NODE_ENV=production` e carrega `.env.production` ou `.env`
- **`npm run build`**: Valida a sintaxe do código (não requer compilação)

