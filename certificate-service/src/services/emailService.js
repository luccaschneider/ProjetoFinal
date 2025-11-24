const axios = require('axios');
require('dotenv').config();

const JAVA_SERVICE_URL = process.env.JAVA_SERVICE_URL || 'http://localhost:8080';

/**
 * Envia email de confirmação de certificado emitido através do serviço Java
 */
async function enviarEmailCertificado(usuarioId, eventId, certificateCode) {
  try {
    const response = await axios.post(
      `${JAVA_SERVICE_URL}/api/emails/certificado`,
      {
        usuarioId,
        eventId,
        certificateCode,
      },
      {
        timeout: 10000, // 10 segundos de timeout
      }
    );
    
    console.log('Email de certificado enviado com sucesso:', response.data);
    return true;
  } catch (error) {
    // Não falhar a geração do certificado se o email falhar
    console.error('Erro ao enviar email de certificado:', error.message);
    if (error.response) {
      console.error('Resposta do servidor:', error.response.data);
    }
    return false;
  }
}

module.exports = {
  enviarEmailCertificado,
};



