const PDFDocument = require('pdfkit');

/**
 * Gera o PDF do certificado
 */
function generateCertificatePDF(certificateData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [842, 595], // A4 horizontal (largura x altura em pontos)
        margins: { top: 0, bottom: 0, left: 0, right: 0 }
      });

      const chunks = [];
      
      doc.on('data', (chunk) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });

      doc.on('error', (error) => {
        reject(error);
      });

      // Cores
      const primaryColor = '#1a237e';
      const secondaryColor = '#3949ab';
      const textColor = '#212121';
      const borderColor = '#e0e0e0';

      // Fundo com gradiente
      doc.rect(0, 0, 842, 595)
         .fill('#f5f5f5');

      // Borda decorativa
      doc.lineWidth(3)
         .strokeColor(primaryColor)
         .rect(30, 30, 782, 535)
         .stroke();

      // Linha decorativa interna
      doc.lineWidth(1)
         .strokeColor(borderColor)
         .rect(50, 50, 742, 495)
         .stroke();

      // Cabeçalho
      doc.fontSize(36)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('CERTIFICADO', 421, 100, {
           align: 'center',
           width: 742
         });

      // Texto principal
      doc.fontSize(16)
         .fillColor(textColor)
         .font('Helvetica')
         .text('Certificamos que', 421, 180, {
           align: 'center',
           width: 742
         });

      // Nome do participante
      doc.fontSize(28)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text(certificateData.usuario_name, 421, 220, {
           align: 'center',
           width: 742
         });

      // Texto do evento
      doc.fontSize(16)
         .fillColor(textColor)
         .font('Helvetica')
         .text('participou do evento', 421, 280, {
           align: 'center',
           width: 742
         });

      // Nome do evento
      doc.fontSize(24)
         .fillColor(secondaryColor)
         .font('Helvetica-Bold')
         .text(certificateData.event_name, 421, 310, {
           align: 'center',
           width: 742
         });

      // Data do evento
      if (certificateData.event_date_start) {
        const eventDate = new Date(certificateData.event_date_start);
        const formattedDate = eventDate.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });

        doc.fontSize(14)
           .fillColor(textColor)
           .font('Helvetica')
           .text(`realizado em ${formattedDate}`, 421, 360, {
             align: 'center',
             width: 742
           });
      }

      // Local do evento (se disponível)
      if (certificateData.event_location) {
        doc.fontSize(12)
           .fillColor('#757575')
           .font('Helvetica')
           .text(certificateData.event_location, 421, 390, {
             align: 'center',
             width: 742
           });
      }

      // Código do certificado
      doc.fontSize(10)
         .fillColor('#9e9e9e')
         .font('Helvetica')
         .text(`Código: ${certificateData.certificate_code}`, 421, 450, {
           align: 'center',
           width: 742
         });

      // Data de emissão
      if (certificateData.issued_at) {
        const issuedDate = new Date(certificateData.issued_at);
        const formattedIssuedDate = issuedDate.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });

        doc.fontSize(10)
           .fillColor('#9e9e9e')
           .font('Helvetica')
           .text(`Emitido em ${formattedIssuedDate}`, 421, 470, {
             align: 'center',
             width: 742
           });
      }

      // Rodapé com texto legal
      doc.fontSize(9)
         .fillColor('#757575')
         .font('Helvetica')
         .text('Este certificado é válido e pode ser verificado através do código acima.', 421, 520, {
           align: 'center',
           width: 742
         });

      doc.fontSize(8)
         .fillColor('#9e9e9e')
         .font('Helvetica')
         .text('Documento gerado automaticamente pelo sistema de certificados.', 421, 540, {
           align: 'center',
           width: 742
         });

      // Finalizar o documento
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateCertificatePDF,
};

