const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const certificateService = require('../services/certificateService');
const pdfService = require('../services/pdfService');
const emailService = require('../services/emailService');

/**
 * @swagger
 * /api/certificates/generate:
 *   post:
 *     summary: Gera um novo certificado
 *     description: Gera um certificado PDF para um usuário com presença confirmada em um evento. Requer autenticação JWT.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Certificados
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - usuarioId
 *             properties:
 *               eventId:
 *                 type: string
 *                 format: uuid
 *                 description: ID do evento
 *               usuarioId:
 *                 type: string
 *                 format: uuid
 *                 description: ID do usuário
 *     responses:
 *       200:
 *         description: Certificado gerado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 certificateCode:
 *                   type: string
 *                   example: CERT-2024-001234
 *                 downloadUrl:
 *                   type: string
 *                   example: /api/certificates/download/CERT-2024-001234
 *       400:
 *         description: Erro na requisição (presença não confirmada, etc.)
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { eventId, usuarioId } = req.body;

    if (!eventId || !usuarioId) {
      return res.status(400).json({ error: 'eventId e usuarioId são obrigatórios' });
    }

    // Verificar se a presença está confirmada
    const attendance = await certificateService.verifyAttendance(usuarioId, eventId);

    // Criar ou buscar certificado existente
    const certificate = await certificateService.createCertificate(
      usuarioId,
      eventId,
      attendance.id
    );

    // Enviar email de confirmação (não bloqueia se falhar)
    emailService.enviarEmailCertificado(
      usuarioId,
      eventId,
      certificate.certificate_code
    ).catch(err => {
      console.error('Falha ao enviar email (não crítico):', err);
    });

    res.json({
      certificateCode: certificate.certificate_code,
      downloadUrl: `/api/certificates/download/${certificate.certificate_code}`,
    });
  } catch (error) {
    console.error('Erro ao gerar certificado:', error);
    if (error.message === 'Presença não confirmada para este evento') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erro ao gerar certificado' });
  }
});

/**
 * @swagger
 * /api/certificates/download/{code}:
 *   get:
 *     summary: Download do PDF do certificado
 *     description: Retorna o PDF do certificado para download. Requer autenticação JWT.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Certificados
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Código do certificado
 *     responses:
 *       200:
 *         description: PDF do certificado
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Certificado não encontrado
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/download/:code', authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;

    const certificate = await certificateService.getCertificateByCode(code);

    if (!certificate) {
      return res.status(404).json({ error: 'Certificado não encontrado' });
    }

    // Gerar PDF
    const pdfBuffer = await pdfService.generateCertificatePDF(certificate);

    // Configurar headers para download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificado-${code}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    res.status(500).json({ error: 'Erro ao gerar PDF do certificado' });
  }
});

/**
 * @swagger
 * /api/certificates/validate/{code}:
 *   get:
 *     summary: Valida um certificado (público)
 *     description: Endpoint público para validar a autenticidade de um certificado através do código.
 *     tags:
 *       - Certificados
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Código do certificado
 *     responses:
 *       200:
 *         description: Resultado da validação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 certificate:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                     usuarioName:
 *                       type: string
 *                     eventName:
 *                       type: string
 *                     eventDate:
 *                       type: string
 *                       format: date-time
 *                     issuedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Certificado não encontrado (inválido)
 */
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const certificate = await certificateService.getCertificateForValidation(code);

    if (!certificate) {
      return res.status(404).json({
        valid: false,
        error: 'Certificado não encontrado ou inválido',
      });
    }

    res.json({
      valid: true,
      certificate: {
        code: certificate.certificate_code,
        usuarioName: certificate.usuario_name,
        eventName: certificate.event_name,
        eventDate: certificate.event_date,
        issuedAt: certificate.issued_at,
      },
    });
  } catch (error) {
    console.error('Erro ao validar certificado:', error);
    res.status(500).json({ error: 'Erro ao validar certificado' });
  }
});

module.exports = router;

