const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Certificate Service API',
      version: '1.0.0',
      description: 'API para geração e validação de certificados de eventos',
      contact: {
        name: 'Equipe de Desenvolvimento',
        email: 'dev@example.com',
      },
    },
    servers: [
      {
        url: process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3001}`,
        description: process.env.SERVER_URL ? 'Servidor Principal (Produção)' : 'Servidor de Desenvolvimento',
      },
      ...(process.env.SERVER_URL && !process.env.SERVER_URL.includes('localhost') ? [{
        url: `http://localhost:${process.env.PORT || 3001}`,
        description: 'Servidor Local (Fallback)',
      }] : []),
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT do serviço Java',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'], // Caminho para os arquivos com anotações Swagger
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
  swaggerSpec,
  swaggerUi,
};

