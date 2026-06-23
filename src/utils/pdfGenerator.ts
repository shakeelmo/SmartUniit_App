import jsPDF from 'jspdf';
import autoTable, { type RowInput } from 'jspdf-autotable';
import { SMART_UNIVERSE_LOGO_BASE64 } from './logoBase64';

let riyalSymbolImagePromise: Promise<string | undefined> | null = null;

function escapeHtml(value: any): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCurrencyAmount(amount: number): string {
  return Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function splitLines(value: any): string[] {
  const text = String(value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return text.length ? text : [];
}

async function loadRiyalSymbolImage(): Promise<string | undefined> {
  if (riyalSymbolImagePromise) return riyalSymbolImagePromise;
  if (typeof document === 'undefined') return undefined;

  riyalSymbolImagePromise = new Promise((resolve) => {
    try {
      const img = new Image();
      img.src = '/Riyal_symbol.svg';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 48;
          canvas.height = 48;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(undefined);
            return;
          }
          ctx.clearRect(0, 0, 48, 48);
          ctx.drawImage(img, 0, 0, 48, 48);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(undefined);
        }
      };
      img.onerror = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  });

  return riyalSymbolImagePromise;
}

function drawCurrencyValue(
  pdf: jsPDF,
  amountText: string,
  x: number,
  y: number,
  options: {
    align?: 'left' | 'right';
    iconDataUrl?: string;
    iconW?: number;
    iconH?: number;
    gap?: number;
  } = {}
) {
  const align = options.align || 'right';
  const iconDataUrl = options.iconDataUrl;
  const iconW = options.iconW ?? 3.1;
  const iconH = options.iconH ?? 3.1;
  const gap = options.gap ?? 1.2;

  if (align === 'right') {
    const amountWidth = pdf.getTextWidth(amountText);
    const startX = x - amountWidth - gap - iconW;
    if (iconDataUrl) {
      try {
        pdf.addImage(iconDataUrl, 'PNG', startX, y - 2.6, iconW, iconH, undefined, 'FAST');
      } catch {
        pdf.text('SAR', startX, y);
      }
    } else {
      pdf.text('SAR', startX, y);
    }
    pdf.text(amountText, x, y, { align: 'right' });
    return;
  }

  if (iconDataUrl) {
    try {
      pdf.addImage(iconDataUrl, 'PNG', x, y - 2.6, iconW, iconH, undefined, 'FAST');
    } catch {
      pdf.text('SAR', x, y);
    }
  } else {
    pdf.text('SAR', x, y);
  }
  pdf.text(amountText, x + iconW + gap, y, { align: 'left' });
}

function drawHeader(pdf: jsPDF, quote: any, settings: any, pageNumber: number) {
  const customer = quote.customer || {};
  const companyInfo = settings?.companyInfo || {};
  const quoteNumber = quote.quoteNumber || quote.quote_number || 'Q-001';
  const quoteDate = new Date(quote.created_at || quote.createdAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const validUntil = quote.validUntil
    ? new Date(quote.validUntil).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '30 days';

  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, 210, 56, 'F');

  try {
    pdf.addImage(SMART_UNIVERSE_LOGO_BASE64, 'JPEG', 12, 10, 16, 16, undefined, 'FAST');
  } catch {
    // Keep the export working even if the image fails to decode.
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(29, 78, 216);
  pdf.setFontSize(18);
  pdf.text('Smart Universe', 31, 16);
  pdf.setFontSize(9);
  pdf.text('FOR COMMUNICATIONS AND', 31, 22);
  pdf.text('INFORMATION TECHNOLOGY', 31, 27);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(55, 65, 81);
  pdf.setFontSize(8.5);
  const addressLines = pdf.splitTextToSize(
    companyInfo.address || 'Office # 3 ln, Al Dirah Dist, P.O.Box 12633, Riyadh - 11461 KSA',
    74
  );
  pdf.text(addressLines, 31, 33);
  pdf.text(`Tel: ${companyInfo.phone || '011-4917295'}`, 31, 42);
  pdf.text(`VAT: ${companyInfo.vatNumber || '314076518400003'}`, 31, 46);
  pdf.text(`CR: ${companyInfo.crNumber || '1010973808'}`, 31, 50);

  pdf.setDrawColor(209, 213, 219);
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(132, 10, 66, 20, 3, 3, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 64, 175);
  pdf.setFontSize(9);
  pdf.text('Quotation #', 137, 17);
  pdf.text(quoteNumber, 187, 17, { align: 'right' });
  pdf.text('Date', 137, 23);
  pdf.text(quoteDate, 187, 23, { align: 'right' });

  pdf.setFontSize(16);
  pdf.text('Quotation', 12, 62);

  pdf.setFillColor(249, 250, 251);
  pdf.setDrawColor(229, 231, 235);
  pdf.roundedRect(12, 66, 186, 22, 3, 3, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 58, 138);
  pdf.setFontSize(10);
  pdf.text('Bill To', 16, 73);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(55, 65, 81);
  pdf.setFontSize(8.5);
  pdf.text(`Name: ${customer.name || 'N/A'}`, 16, 79);
  pdf.text(`Company: ${customer.company || 'N/A'}`, 16, 84);
  pdf.text(`Phone: ${customer.phone || 'N/A'}`, 100, 79);
  pdf.text(`Email: ${customer.email || 'N/A'}`, 100, 84);
  pdf.text(`Valid Until: ${validUntil}`, 16, 89);

  pdf.setDrawColor(219, 228, 240);
  pdf.line(12, 92, 198, 92);

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(107, 114, 128);
  pdf.setFontSize(8);
  pdf.text(`Page ${pageNumber}`, 198, 8, { align: 'right' });
}

function drawFooter(pdf: jsPDF) {
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setFillColor(17, 24, 39);
  pdf.roundedRect(12, pageHeight - 14, 186, 10, 2.5, 2.5, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Smart Universe for Communications and Information Technology', 105, pageHeight - 9, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.text('Riyadh, Saudi Arabia | Phone: +966 11 4917295 | Email: info@smartuniit.com', 105, pageHeight - 5.5, { align: 'center' });
}

export async function generateQuotationPDF(quote: any, settings: any = {}) {
  const riyalSymbolImage = await loadRiyalSymbolImage();
  const lineItems = (quote.lineItems || [])
    .map((item: any) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice || item.unit_price || 0);
      const total = Number(item.total || item.total_price || quantity * unitPrice || 0);
      const description = String(item.description || item.name || '').trim();
      return {
        ...item,
        quantity,
        unitPrice,
        total,
        description,
      };
    })
    .filter((item: any) => (item.description || item.itemCode || item.code) && item.quantity > 0);

  const subtotal = lineItems.reduce((sum: number, item: any) => sum + item.total, 0);
  const discountType = quote.discountType || 'percentage';
  const discountValue = Number(quote.discountValue || 0);
  const discountAmount = discountValue > 0
    ? discountType === 'percentage'
      ? subtotal * (discountValue / 100)
      : discountValue
    : 0;
  const vatRate = Number(quote.vatRate || settings?.vatRate || 15);
  const vatAmount = (subtotal - discountAmount) * (vatRate / 100);
  const total = subtotal - discountAmount + vatAmount;
  const bankingDetails = settings?.companyInfo?.bankingDetails || {};
  const pointOfContact = quote.pointOfContact || {};
  const termsLines = splitLines(quote.terms || 'Payment terms: 30 days from invoice date');

  const pdf = new jsPDF('p', 'mm', 'a4');
  let pageNumber = 1;
  drawHeader(pdf, quote, settings, pageNumber);

  const bodyRows: RowInput[] = lineItems.length
      ? lineItems.map((item: any, index: number) => ([
        String(index + 1),
        String(item.itemCode || item.code || item.sku || item.partNumber || '-'),
        String(item.description || item.name || '-'),
        String(item.quantity),
        formatCurrencyAmount(item.unitPrice),
        formatCurrencyAmount(item.total),
      ]))
    : [[ '', '', 'No items to display', '', '', '' ]];

  autoTable(pdf, {
    startY: 96,
    margin: { left: 12, right: 12, top: 96, bottom: 24 },
    head: [['S#', 'Item', 'Description', 'Qty', 'Unit Price', 'Total']],
    body: bodyRows,
    theme: 'grid',
    showHead: 'everyPage',
    rowPageBreak: 'avoid',
    styles: {
      font: 'helvetica',
      fontSize: 8.8,
      cellPadding: { top: 3.2, right: 2.8, bottom: 3.2, left: 2.8 },
      minCellHeight: 9.5,
      lineColor: [209, 213, 219],
      lineWidth: 0.2,
      textColor: [31, 41, 55],
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      minCellHeight: 10,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28, halign: 'center' },
      2: { cellWidth: 74 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 31, halign: 'right' },
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        pageNumber = data.pageNumber;
        drawHeader(pdf, quote, settings, pageNumber);
      }
      drawFooter(pdf);
    },
    didDrawCell: (data) => {
      if (data.section !== 'body') return;
      if (data.column.index !== 4 && data.column.index !== 5) return;
      const text = Array.isArray(data.cell.text) ? data.cell.text.join(' ') : String(data.cell.text || '');
      if (!text.trim()) return;
      const rightX = data.cell.x + data.cell.width - data.cell.padding('right');
      const centerY = data.cell.y + data.cell.height / 2 + 1;
      drawCurrencyValue(pdf, text, rightX, centerY, { align: 'right', iconDataUrl: riyalSymbolImage, iconW: 2.7, iconH: 2.7, gap: 0.8 });
    },
  });

  let currentY = (pdf as any).lastAutoTable.finalY + 6;
  const pageHeight = pdf.internal.pageSize.getHeight();

  const ensureSpace = (requiredHeight: number) => {
    if (currentY + requiredHeight <= pageHeight - 18) {
      return;
    }
    pdf.addPage();
    pageNumber += 1;
    drawHeader(pdf, quote, settings, pageNumber);
    drawFooter(pdf);
    currentY = 96;
  };

  ensureSpace(34);
  pdf.setDrawColor(30, 64, 175);
  pdf.line(118, currentY, 198, currentY);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(55, 65, 81);
  pdf.setFontSize(9);
  currentY += 5;
  pdf.text('Subtotal', 118, currentY);
  drawCurrencyValue(pdf, formatCurrencyAmount(subtotal), 198, currentY, { align: 'right', iconDataUrl: riyalSymbolImage });
  if (discountAmount > 0) {
    currentY += 5;
    pdf.text(`Discount${discountType === 'percentage' ? ` (${discountValue}%)` : ''}`, 118, currentY);
    pdf.text(`- ${formatCurrencyAmount(discountAmount)}`, 198, currentY, { align: 'right' });
  }
  currentY += 5;
  pdf.text(`VAT (${vatRate}%)`, 118, currentY);
  drawCurrencyValue(pdf, formatCurrencyAmount(vatAmount), 198, currentY, { align: 'right', iconDataUrl: riyalSymbolImage });
  currentY += 2;
  pdf.setDrawColor(203, 213, 225);
  pdf.line(118, currentY, 198, currentY);
  currentY += 6;
  pdf.setFontSize(12);
  pdf.setTextColor(30, 64, 175);
  pdf.text('Total', 118, currentY);
  drawCurrencyValue(pdf, formatCurrencyAmount(total), 198, currentY, { align: 'right', iconDataUrl: riyalSymbolImage, iconW: 3.4, iconH: 3.4, gap: 1.4 });

  currentY += 8;
  ensureSpace(66);

  const boxWidth = 90;
  const boxGap = 6;
  const boxTop = currentY;
  const leftX = 12;
  const rightX = leftX + boxWidth + boxGap;

  const bankLines = [
    `Bank: ${bankingDetails.bankName || 'Saudi National Bank'}`,
    `IBAN: ${bankingDetails.iban || 'SA3610000041000000080109'}`,
    `Account Number: ${bankingDetails.accountNumber || '41000000080109'}`,
    '',
    pointOfContact.title || 'Smart Universe : Primary Contact of this Project',
    `Name: ${pointOfContact.name || 'N/A'}`,
    `Designation: ${pointOfContact.designation || 'N/A'}`,
    `Mobily Number: ${pointOfContact.mobileNumber || 'N/A'}`,
    `Email Address: ${pointOfContact.emailAddress || 'N/A'}`,
  ];

  const termsTextLines = termsLines.length ? termsLines : ['Payment terms: 30 days from invoice date'];
  const wrappedTerms = termsTextLines.flatMap((line) => pdf.splitTextToSize(line, boxWidth - 8));
  const wrappedBank = bankLines.flatMap((line) => line ? pdf.splitTextToSize(line, boxWidth - 8) : ['']);
  const contentHeight = Math.max(wrappedTerms.length, wrappedBank.length) * 4.3 + 14;
  const boxHeight = Math.max(38, contentHeight);

  pdf.setFillColor(250, 250, 250);
  pdf.setDrawColor(229, 231, 235);
  pdf.roundedRect(leftX, boxTop, boxWidth, boxHeight, 2.5, 2.5, 'FD');
  pdf.roundedRect(rightX, boxTop, boxWidth, boxHeight, 2.5, 2.5, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 64, 175);
  pdf.setFontSize(10);
  pdf.text('Terms & Conditions', leftX + 4, boxTop + 6);
  pdf.text('Banking Details', rightX + 4, boxTop + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(55, 65, 81);
  pdf.setFontSize(8.2);
  pdf.text(wrappedTerms, leftX + 4, boxTop + 11);
  pdf.text(wrappedBank, rightX + 4, boxTop + 11);

  return pdf.output('blob');
}
