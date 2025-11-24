# Certificate Service

Serviço Node.js para emissão e validação de certificados de eventos.

## Funcionalidades

- Geração de certificados em PDF para participantes com presença confirmada
- Validação pública de certificados via código único
- Integração com banco de dados PostgreSQL compartilhado
- Autenticação via JWT do serviço Java

## Instalação

```bash
npm install
```

## Configuração

### Variáveis de Ambiente

O serviço suporta diferentes arquivos de ambiente baseado no `NODE_ENV`:

- **Desenvolvimento**: `.env.development` ou `.env`
- **Produção**: `.env.production` ou `.env`

Crie os arquivos `.env.development` e `.env.production` com as seguintes variáveis:

```bash
# Variáveis necessárias
NODE_ENV=development  # ou production
PORT=3001
ALLOWED_IP=localhost  # ou 177.44.248.82 em produção
DB_HOST=localhost
DB_PORT=5433
DB_NAME=microsservicos_db
DB_USER=postgres
DB_PASSWORD=postgres
JAVA_SERVICE_URL=http://localhost:8080  # ou http://177.44.248.82:8080 em produção
```

### Instalação de Dependências

```bash
npm install
```

## Execução

### Desenvolvimento
```bash
npm run dev
```
- Usa `NODE_ENV=development`
- Carrega variáveis de `.env.development` ou `.env`
- Usa `nodemon` para hot-reload

### Build (Validação)
```bash
npm run build
```
- Valida a sintaxe do código
- Não requer compilação (serviço Node.js puro)

### Produção
```bash
npm start
```
- Usa `NODE_ENV=production`
- Carrega variáveis de `.env.production` ou `.env`
- Executa o servidor otimizado

## Endpoints

- `POST /api/certificates/generate` - Gera um novo certificado (requer autenticação)
- `GET /api/certificates/download/:code` - Download do PDF do certificado (requer autenticação)
- `GET /api/certificates/validate/:code` - Valida um certificado (público)

## Documentação

Acesse `/api-docs` para ver a documentação Swagger completa.

