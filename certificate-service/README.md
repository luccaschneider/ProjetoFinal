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

Copie o arquivo `.env.example` para `.env` e configure as variáveis de ambiente:

```bash
cp .env.example .env
```

## Execução

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

## Endpoints

- `POST /api/certificates/generate` - Gera um novo certificado (requer autenticação)
- `GET /api/certificates/download/:code` - Download do PDF do certificado (requer autenticação)
- `GET /api/certificates/validate/:code` - Valida um certificado (público)

## Documentação

Acesse `/api-docs` para ver a documentação Swagger completa.

