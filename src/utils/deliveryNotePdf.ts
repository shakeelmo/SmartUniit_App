import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { SMART_UNIVERSE_LOGO_BASE64 } from './logoBase64';

const COMPANY = {
  legalName: 'Smart Universe Communication and Information Technology',
  address: 'Office # 3 ln, Al Dirah Dist, P.O.Box 12633, Riyadh - 11461 KSA',
  phone: '011-4917295',
  email: 'info@smartuniit.com',
};

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;

const cleanText = (value: any): string => {
  if (!value) return '';
  if (value === 'NULL' || value === 'null') return '';
  return String(value).replace(/\r\n/g, '\n').trim();
};

const formatDate = (value?: string): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, 'dd/MM/yyyy');
};

export async function generateDeliveryNotePdf(note: any) {
  const raw = note || {};
  const items = Array.isArray(raw.items) ? raw.items : [];
  const noteNumber = raw.note_number || raw.noteNumber || '';
  const customerName = raw.customer_name || raw.customerName || '';
  const recipientName = cleanText(raw.recipient_name || raw.recipientName);
  const deliveryDate = raw.delivery_date || raw.deliveryDate || '';
  const invoiceId = raw.invoice_id || raw.invoiceId || '';
  const notes = cleanText(raw.notes);
  const signature = raw.signature || '';
  const status = raw.status || 'draft';

  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });

  // Header
  try {
    pdf.addImage(SMART_UNIVERSE_LOGO_BASE64, 'PNG', MARGIN, 10, 46, 18);
  } catch {
    // Logo optional
  }
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(30, 64, 175);
  pdf.text(COMPANY.legalName, 64, 16);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(COMPANY.address, 64, 21);
  pdf.text(`Tel: ${COMPANY.phone}  |  ${COMPANY.email}`, 64, 25);

  pdf.setDrawColor(30, 64, 175);
  pdf.setLineWidth(0.6);
  pdf.line(MARGIN, 31, PAGE_W - MARGIN, 31);

  // Title + meta
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(23, 37, 84);
  pdf.text('DELIVERY NOTE', PAGE_W / 2, 44, { align: 'center' });
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    `Note No: ${noteNumber || '-'}    |    Date: ${formatDate(deliveryDate)}    |    Status: ${status.toUpperCase()}`,
    PAGE_W / 2,
    50,
    { align: 'center' }
  );

  // Customer / delivery block
  autoTable(pdf, {
    startY: 57,
    margin: { left: MARGIN, right: MARGIN },
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
    head: [['Delivered To', 'Delivery Details']],
    body: [
      [
        [
          ['Customer', customerName || '-'],
          ['Recipient', recipientName || '-'],
          ['Reference', invoiceId ? `Invoice ${invoiceId}` : '-'],
        ]
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n'),
        [
          ['Delivery Date', formatDate(deliveryDate) || '-'],
          ['Note No', noteNumber || '-'],
          ['Status', status.toUpperCase()],
        ]
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n'),
      ],
    ],
  });

  // Items table
  const itemsStartY = (pdf as any).lastAutoTable.finalY + 8;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(23, 37, 84);
  pdf.text('Items Delivered', MARGIN, itemsStartY);

  autoTable(pdf, {
    startY: itemsStartY + 3,
    margin: { left: MARGIN, right: MARGIN },
    theme: 'striped',
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
    head: [['#', 'Description', 'Qty', 'Unit', 'Remarks']],
    body:
      items.length > 0
        ? items.map((item: any, index: number) => [
            String(index + 1),
            cleanText(item.description || item.name) || '-',
            String(item.quantity ?? 1),
            cleanText(item.unit) || 'pcs',
            cleanText(item.remarks) || '',
          ])
        : [['-', 'No items recorded', '', '', '']],
  });

  let y = (pdf as any).lastAutoTable.finalY + 10;

  // Notes
  if (notes) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.5);
    pdf.setTextColor(23, 37, 84);
    pdf.text('Notes', MARGIN, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(51, 65, 85);
    const noteLines = pdf.splitTextToSize(notes, CONTENT_W);
    y += 5;
    for (const line of noteLines) {
      if (y > PAGE_H - 55) break;
      pdf.text(line, MARGIN, y);
      y += 4.5;
    }
    y += 5;
  }

  // Signature area
  if (y > PAGE_H - 55) {
    pdf.addPage();
    y = 24;
  }
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(23, 37, 84);
  pdf.text('Sign-off', MARGIN, y);
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN, y + 1.5, MARGIN + 30, y + 1.5);
  y += 8;

  const blockW = (CONTENT_W - 10) / 2;
  const signBlocks = [
    { title: 'Received By', sub: recipientName ? `Name: ${recipientName}` : 'Name: ____________________' },
    { title: 'For Smart Universe', sub: 'Name: ____________________' },
  ];
  signBlocks.forEach((block, index) => {
    const x = MARGIN + index * (blockW + 10);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(23, 37, 84);
    pdf.text(block.title, x, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(51, 65, 85);
    pdf.text(block.sub, x, y + 5);
    pdf.setDrawColor(30, 64, 175);
    pdf.setLineWidth(0.4);
    pdf.line(x, y + 34, x + blockW, y + 34);
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text('Signature & Date', x, y + 37);
    if (index === 0 && signature) {
      try {
        const format = signature.includes('image/jpeg') ? 'JPEG' : 'PNG';
        pdf.addImage(signature, format, x + 2, y + 12, blockW * 0.55, 18);
      } catch {
        // Signature image optional
      }
    }
  });

  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(220, 226, 237);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(107, 114, 128);
    pdf.text(`${COMPANY.legalName} | Tel: ${COMPANY.phone} | ${COMPANY.email}`, PAGE_W / 2, PAGE_H - 8, {
      align: 'center',
    });
    pdf.text(`Page ${i} of ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' });
  }

  return pdf;
}
