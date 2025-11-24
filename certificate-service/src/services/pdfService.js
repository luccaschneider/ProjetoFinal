const PDFDocument = require('pdfkit');

/**
 * Gera o PDF do certificado
 */
function generateCertificatePDF(certificateData) {
  return new Promise((resolve, reject) => {
    try {
      // A4 horizontal: 842 x 595 pontos (largura x altura)
      const pageWidth = 842;
      const pageHeight = 595;
      
      // Margens adequadas para evitar cortes
      const margin = 50;
      const contentWidth = pageWidth - (margin * 2); // 742 pontos
      const contentX = margin; // Posição X inicial do conteúdo
      const centerX = pageWidth / 2; // Centro horizontal da página

      const doc = new PDFDocument({
        size: [pageWidth, pageHeight],
        margins: { top: margin, bottom: margin, left: margin, right: margin }
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

      // Fundo
      doc.rect(0, 0, pageWidth, pageHeight)
         .fill('#f5f5f5');

      // Borda decorativa externa
      doc.lineWidth(3)
         .strokeColor(primaryColor)
         .rect(margin - 20, margin - 20, contentWidth + 40, pageHeight - (margin * 2) + 40)
         .stroke();

      // Linha decorativa interna
      doc.lineWidth(1)
         .strokeColor(borderColor)
         .rect(margin, margin, contentWidth, pageHeight - (margin * 2))
         .stroke();

      // Posições Y (vertical) - espaçadas para caber tudo em uma página
      let currentY = margin + 40;

      // Cabeçalho - CERTIFICADO
      doc.fontSize(36)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('CERTIFICADO', contentX, currentY, {
           align: 'center',
           width: contentWidth
         });
      currentY += 50;

      // Texto principal
      doc.fontSize(16)
         .fillColor(textColor)
         .font('Helvetica')
         .text('Certificamos que', contentX, currentY, {
           align: 'center',
           width: contentWidth
         });
      currentY += 35;

      // Nome do participante (pode ser longo, então permite quebra de linha)
      doc.fontSize(28)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text(certificateData.usuario_name, contentX, currentY, {
           align: 'center',
           width: contentWidth,
           ellipsis: false
         });
      // Ajustar Y baseado na altura do texto (máximo 2 linhas)
      const nameHeight = doc.heightOfString(certificateData.usuario_name, {
        width: contentWidth
      });
      currentY += Math.max(nameHeight, 40);

      // Texto do evento
      doc.fontSize(16)
         .fillColor(textColor)
         .font('Helvetica')
         .text('participou do evento', contentX, currentY, {
           align: 'center',
           width: contentWidth
         });
      currentY += 35;

      // Nome do evento (pode ser longo)
      doc.fontSize(24)
         .fillColor(secondaryColor)
         .font('Helvetica-Bold')
         .text(certificateData.event_name, contentX, currentY, {
           align: 'center',
           width: contentWidth,
           ellipsis: false
         });
      const eventNameHeight = doc.heightOfString(certificateData.event_name, {
        width: contentWidth
      });
      currentY += Math.max(eventNameHeight, 35);

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
           .text(`realizado em ${formattedDate}`, contentX, currentY, {
             align: 'center',
             width: contentWidth
           });
        currentY += 30;
      }

      // Local do evento (se disponível)
      if (certificateData.event_location) {
        doc.fontSize(12)
           .fillColor('#757575')
           .font('Helvetica')
           .text(certificateData.event_location, contentX, currentY, {
             align: 'center',
             width: contentWidth,
             ellipsis: false
           });
        const locationHeight = doc.heightOfString(certificateData.event_location, {
          width: contentWidth
        });
        currentY += Math.max(locationHeight, 25);
      }

      // Espaço antes do rodapé
      currentY = pageHeight - margin - 100;

      // Código do certificado
      doc.fontSize(10)
         .fillColor('#9e9e9e')
         .font('Helvetica')
         .text(`Código: ${certificateData.certificate_code}`, contentX, currentY, {
           align: 'center',
           width: contentWidth
         });
      currentY += 20;

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
           .text(`Emitido em ${formattedIssuedDate}`, contentX, currentY, {
             align: 'center',
             width: contentWidth
           });
        currentY += 20;
      }

      // Rodapé com texto legal
      doc.fontSize(9)
         .fillColor('#757575')
         .font('Helvetica')
         .text('Este certificado é válido e pode ser verificado através do código acima.', contentX, currentY, {
           align: 'center',
           width: contentWidth
         });
      currentY += 15;

      doc.fontSize(8)
         .fillColor('#9e9e9e')
         .font('Helvetica')
         .text('Documento gerado automaticamente pelo sistema de certificados.', contentX, currentY, {
           align: 'center',
           width: contentWidth
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

