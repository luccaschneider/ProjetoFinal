const express = require('express');
const cors = require('cors');
const path = require('path');

// Carregar variáveis de ambiente baseado no NODE_ENV
// Primeiro tenta carregar o arquivo específico do ambiente, depois o .env genérico
const env = process.env.NODE_ENV || 'development';
const envFile = env === 'production' ? '.env.production' : '.env.development';

// Tentar carregar arquivo específico do ambiente
try {
  require('dotenv').config({ path: path.resolve(__dirname, '..', envFile) });
} catch (error) {
  // Ignorar se o arquivo não existir
}

// Sempre carregar .env como fallback
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// Log do ambiente atual (apenas em desenvolvimento)
if (env === 'development') {
  console.log(`🔧 Ambiente: ${env}`);
  console.log(`📁 Arquivo de env: ${envFile}`);
}

const certificateRoutes = require('./routes/certificateRoutes');
const { swaggerSpec, swaggerUi } = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 3001;
const ALLOWED_IP = process.env.ALLOWED_IP || '177.44.248.82';

// Configuração de CORS para aceitar requisições do IP específico
const allowedOrigins = [
  `http://${ALLOWED_IP}`,
  `http://${ALLOWED_IP}:3000`,
  `http://${ALLOWED_IP}:3001`,
  `http://${ALLOWED_IP}:8080`,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:8080',
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Verificar se o origin está na lista permitida
    if (allowedOrigins.includes(origin) || origin.includes(ALLOWED_IP)) {
      callback(null, true);
    } else {
      // Para desenvolvimento, permitir localhost
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        console.warn(`CORS bloqueado para origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
};

app.use(cors(corsOptions));

// Middleware para parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'certificate-service' });
});

// Rotas da API
app.use('/api/certificates', certificateRoutes);

// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Certificate Service API',
    version: '1.0.0',
    docs: '/api-docs',
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Certificate Service rodando na porta ${PORT}`);
  console.log(`📚 Documentação disponível em http://localhost:${PORT}/api-docs`);
  console.log(`🌐 IP permitido para CORS: ${ALLOWED_IP}`);
  console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Java Service URL: ${process.env.JAVA_SERVICE_URL || 'http://localhost:8080'}`);
});

module.exports = app;

