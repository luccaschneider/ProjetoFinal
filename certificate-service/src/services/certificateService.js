const dbService = require('./dbService');

/**
 * Gera um código único de certificado no formato CERT-YYYY-NNNNNN
 */
async function generateCertificateCode() {
  const year = new Date().getFullYear();
  
  // Buscar o último código do ano atual
  const result = await dbService.query(
    `SELECT certificate_code FROM certificate 
     WHERE certificate_code LIKE $1 
     ORDER BY certificate_code DESC 
     LIMIT 1`,
    [`CERT-${year}-%`]
  );

  let sequence = 1;
  
  if (result.rows.length > 0) {
    const lastCode = result.rows[0].certificate_code;
    const lastSequence = parseInt(lastCode.split('-')[2]);
    sequence = lastSequence + 1;
  }

  // Formatar sequência com 6 dígitos
  const formattedSequence = sequence.toString().padStart(6, '0');
  return `CERT-${year}-${formattedSequence}`;
}

/**
 * Verifica se o usuário tem presença confirmada no evento
 */
async function verifyAttendance(usuarioId, eventId) {
  const result = await dbService.query(
    `SELECT ea.id, ea.presente, ea.confirmed_at
     FROM event_attendance ea
     WHERE ea.usuario_id = $1 AND ea.event_id = $2 AND ea.presente = true`,
    [usuarioId, eventId]
  );

  if (result.rows.length === 0) {
    throw new Error('Presença não confirmada para este evento');
  }

  return result.rows[0];
}

/**
 * Verifica se já existe certificado para esta presença
 */
async function checkExistingCertificate(eventAttendanceId) {
  const result = await dbService.query(
    `SELECT id, certificate_code FROM certificate 
     WHERE event_attendance_id = $1`,
    [eventAttendanceId]
  );

  return result.rows[0] || null;
}

/**
 * Cria um novo certificado no banco de dados
 */
async function createCertificate(usuarioId, eventId, eventAttendanceId) {
  // Verificar se já existe certificado
  const existing = await checkExistingCertificate(eventAttendanceId);
  if (existing) {
    return existing;
  }

  // Gerar código único
  const certificateCode = await generateCertificateCode();

  // Inserir certificado
  const result = await dbService.query(
    `INSERT INTO certificate (certificate_code, usuario_id, event_id, event_attendance_id, issued_at, created_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING id, certificate_code, issued_at`,
    [certificateCode, usuarioId, eventId, eventAttendanceId]
  );

  return result.rows[0];
}

/**
 * Busca informações completas do certificado para validação
 */
async function getCertificateForValidation(certificateCode) {
  const result = await dbService.query(
    `SELECT 
       c.id,
       c.certificate_code,
       c.issued_at,
       u.name as usuario_name,
       u.email as usuario_email,
       e.nome as event_name,
       e.data_hora_inicio as event_date,
       e.local_evento as event_location
     FROM certificate c
     INNER JOIN usuario u ON c.usuario_id = u.id
     INNER JOIN event e ON c.event_id = e.id
     WHERE c.certificate_code = $1`,
    [certificateCode]
  );

  return result.rows[0] || null;
}

/**
 * Busca certificado por código para download
 */
async function getCertificateByCode(certificateCode) {
  const result = await dbService.query(
    `SELECT 
       c.*,
       u.name as usuario_name,
       u.email as usuario_email,
       e.nome as event_name,
       e.data_hora_inicio as event_date_start,
       e.data_hora_fim as event_date_end,
       e.local_evento as event_location,
       e.detalhes as event_details
     FROM certificate c
     INNER JOIN usuario u ON c.usuario_id = u.id
     INNER JOIN event e ON c.event_id = e.id
     WHERE c.certificate_code = $1`,
    [certificateCode]
  );

  return result.rows[0] || null;
}

module.exports = {
  generateCertificateCode,
  verifyAttendance,
  checkExistingCertificate,
  createCertificate,
  getCertificateForValidation,
  getCertificateByCode,
};

