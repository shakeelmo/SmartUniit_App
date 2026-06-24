import jsPDF from 'jspdf';
import autoTable, { type RowInput } from 'jspdf-autotable';
import { SMART_UNIVERSE_LOGO_BASE64 } from './logoBase64';
import amiriFontUrl from '../../Amiri-Regular.ttf?url';

let riyalSymbolImagePromise: Promise<string | undefined> | null = null;
let amiriFontReadyPromise: Promise<void> | null = null;
let arabicHeaderImagePromise: Promise<{ full?: string; compact?: string }> | null = null;
const ARABIC_COMPANY_NAME = 'شركة الكون الذكي للاتصالات و تقنية المعلومات';

const HEADER_HEIGHT = 72;
const FIRST_PAGE_TABLE_START_Y = 107;
const CONTINUATION_TABLE_START_Y = 66;
const PAGE_FOOTER_TOP_MARGIN = 24;
const HEADER_LEFT_COL_X = 12;
const HEADER_LEFT_TEXT_X = 29;
const HEADER_LEFT_COL_WIDTH = 78;
const HEADER_MIDDLE_COL_X = 112;
const HEADER_MIDDLE_COL_WIDTH = 86;
const HEADER_RIGHT_COL_X = 154;
const HEADER_RIGHT_COL_WIDTH = 44;
const HEADER_QUOTE_BOX_TOP = 39;
const HEADER_QUOTE_BOX_HEIGHT = 18;

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

async function ensureAmiriFont(pdf: jsPDF): Promise<void> {
  if (amiriFontReadyPromise) {
    await amiriFontReadyPromise;
    return;
  }
  if (typeof fetch === 'undefined') return;

  amiriFontReadyPromise = (async () => {
    const response = await fetch(amiriFontUrl);
    const buffer = await response.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }

    const base64 = btoa(binary);
    if (!pdf.existsFileInVFS('Amiri-Regular.ttf')) {
      pdf.addFileToVFS('Amiri-Regular.ttf', base64);
    }
    const fontList = pdf.getFontList() as Record<string, unknown>;
    if (!fontList.Amiri) {
      pdf.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    }
  })();

  await amiriFontReadyPromise;
}

async function loadArabicHeaderImages(settings: any): Promise<{ full?: string; compact?: string }> {
  if (arabicHeaderImagePromise) {
    return arabicHeaderImagePromise;
  }
  if (typeof document === 'undefined') return {};

  arabicHeaderImagePromise = (async () => {
    try {
      const font = new FontFace('AmiriCanvas', `url(${amiriFontUrl})`);
      await font.load();
      (document as any).fonts?.add(font);
      await (document as any).fonts?.ready;
    } catch {
      // Fall back to system fonts if the explicit font face fails.
    }

    const companyInfo = settings?.companyInfo || {};
    const fullLines = [
      ARABIC_COMPANY_NAME,
      companyInfo.addressAr || 'مكتب رقم 3، حي الديرة، ص.ب 12633، الرياض 11461، المملكة العربية السعودية',
      `رقم الضريبة المضافة: ${companyInfo.vatNumber || '314076518400003'}`,
      `السجل التجاري: ${companyInfo.crNumber || '1010973808'}`,
    ];
    const compactLines = [ARABIC_COMPANY_NAME];

    const renderBlock = (lines: string[], width: number, height: number, styles: { titleSize: number; bodySize: number }) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return undefined;

      ctx.clearRect(0, 0, width, height);
      ctx.textAlign = 'right';
      ctx.direction = 'rtl';
      ctx.fillStyle = '#1e40af';
      ctx.font = `700 ${styles.titleSize}px "AmiriCanvas", "Amiri", "Tahoma", sans-serif`;

      const maxTextWidth = width - 8;
      const wrapLine = (text: string, font: string) => {
        ctx.font = font;
        const words = text.split(' ');
        const rendered: string[] = [];
        let current = '';
        for (const word of words) {
          const next = current ? `${current} ${word}` : word;
          if (ctx.measureText(next).width > maxTextWidth && current) {
            rendered.push(current);
            current = word;
          } else {
            current = next;
          }
        }
        if (current) rendered.push(current);
        return rendered;
      };

      let y = styles.titleSize;
      const titleFont = `700 ${styles.titleSize}px "AmiriCanvas", "Amiri", "Tahoma", sans-serif`;
      const bodyFont = `400 ${styles.bodySize}px "AmiriCanvas", "Amiri", "Tahoma", sans-serif`;
      wrapLine(lines[0], titleFont).slice(0, 3).forEach((line) => {
        ctx.font = titleFont;
        ctx.fillStyle = '#1e40af';
        ctx.fillText(line, width - 4, y);
        y += styles.titleSize + 2;
      });

      for (const line of lines.slice(1)) {
        const wrapped = wrapLine(line, bodyFont);
        ctx.font = bodyFont;
        ctx.fillStyle = '#374151';
        wrapped.slice(0, 2).forEach((segment) => {
          ctx.fillText(segment, width - 4, y);
          y += styles.bodySize + 2;
        });
      }

      return canvas.toDataURL('image/png');
    };

    return {
      full: renderBlock(fullLines, 1600, 360, { titleSize: 92, bodySize: 56 }),
      compact: renderBlock(compactLines, 860, 150, { titleSize: 62, bodySize: 38 }),
    };
  })();

  return arabicHeaderImagePromise;
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

function drawArabicText(pdf: jsPDF, text: string, x: number, y: number, options?: { align?: 'right' | 'left' }) {
  const previousFont = pdf.getFont();
  const wasR2L = pdf.getR2L();
  pdf.setFont('Amiri', 'normal');
  pdf.setR2L(true);
  pdf.text(text, x, y, { align: options?.align || 'right' });
  pdf.setR2L(wasR2L);
  pdf.setFont(previousFont.fontName, previousFont.fontStyle);
}

function splitArabicText(pdf: jsPDF, text: string, width: number, fontSize: number): string[] {
  const previousFont = pdf.getFont();
  const previousSize = pdf.getFontSize();
  pdf.setFont('Amiri', 'normal');
  pdf.setFontSize(fontSize);
  const lines = pdf.splitTextToSize(text, width);
  pdf.setFont(previousFont.fontName, previousFont.fontStyle);
  pdf.setFontSize(previousSize);
  return Array.isArray(lines) ? lines : [String(lines)];
}

function drawCompanyHeader(
  pdf: jsPDF,
  settings: any,
  pageNumber: number,
  arabicHeaderImages?: { full?: string; compact?: string }
) {
  const companyInfo = settings?.companyInfo || {};
  const quoteBoxTop = HEADER_QUOTE_BOX_TOP;
  const quoteBoxX = HEADER_RIGHT_COL_X;
  const quoteBoxWidth = HEADER_RIGHT_COL_WIDTH;

  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, 210, HEADER_HEIGHT, 'F');

  try {
    pdf.addImage(SMART_UNIVERSE_LOGO_BASE64, 'JPEG', HEADER_LEFT_COL_X, 10, 14, 14, undefined, 'FAST');
  } catch {
    // Keep the export working even if the image fails to decode.
  }

  const companyName = companyInfo.name || 'Smart Universe Communication and Information Technology';
  const wrappedName = pdf.splitTextToSize(companyName, HEADER_LEFT_COL_WIDTH - 6).slice(0, 4);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(29, 78, 216);
  pdf.setFontSize(wrappedName.length > 3 ? 8.2 : wrappedName.length > 2 ? 8.9 : wrappedName.length > 1 ? 9.5 : 10.3);
  pdf.text(wrappedName, HEADER_LEFT_TEXT_X, 13.2, { lineHeightFactor: 1.02 });

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(55, 65, 81);
  pdf.setFontSize(7.9);
  const addressLines = pdf.splitTextToSize(
    companyInfo.address || 'Office # 3 ln, Al Dirah Dist, P.O.Box 12633, Riyadh - 11461 KSA',
    HEADER_LEFT_COL_WIDTH - 6
  );
  pdf.text(addressLines, HEADER_LEFT_TEXT_X, 24.5, { lineHeightFactor: 1.02 });
  const companyDetailsTop = 33.5;
  pdf.text(`Tel: ${companyInfo.phone || '011-4917295'}`, HEADER_LEFT_TEXT_X, companyDetailsTop);
  pdf.text(`VAT: ${companyInfo.vatNumber || '314076518400003'}`, HEADER_LEFT_TEXT_X, companyDetailsTop + 5.3);
  pdf.text(`CR: ${companyInfo.crNumber || '1010973808'}`, HEADER_LEFT_TEXT_X, companyDetailsTop + 10.6);

  pdf.setDrawColor(219, 228, 240);
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(HEADER_MIDDLE_COL_X, 6.5, HEADER_MIDDLE_COL_WIDTH, 28, 3, 3, 'FD');
  const arabicImage = arabicHeaderImages?.full || arabicHeaderImages?.compact;
  if (arabicImage) {
    try {
      pdf.addImage(
        arabicImage,
        'PNG',
        HEADER_MIDDLE_COL_X + 1,
        7.3,
        HEADER_MIDDLE_COL_WIDTH - 2,
        24,
        undefined,
        'FAST'
      );
    } catch {
      // ignore and keep box visible
    }
  }

  pdf.setDrawColor(209, 213, 219);
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(quoteBoxX, quoteBoxTop, quoteBoxWidth, HEADER_QUOTE_BOX_HEIGHT, 3, 3, 'FD');
  pdf.setDrawColor(219, 228, 240);
  pdf.line(12, HEADER_HEIGHT, 198, HEADER_HEIGHT);

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(107, 114, 128);
  pdf.setFontSize(8);
  pdf.text(`Page ${pageNumber}`, 198, 6.5, { align: 'right' });
}

function drawHeader(
  pdf: jsPDF,
  quote: any,
  settings: any,
  pageNumber: number,
  includeCustomer = true,
  arabicHeaderImages?: { full?: string; compact?: string }
): number {
  const customer = quote.customer || {};
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

  drawCompanyHeader(pdf, settings, pageNumber, arabicHeaderImages);

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 64, 175);
  pdf.setFontSize(9);
  if (!includeCustomer) {
    pdf.setFontSize(5.7);
    pdf.text('Quotation #', HEADER_RIGHT_COL_X + 2.2, HEADER_QUOTE_BOX_TOP + 5.4);
    pdf.text(quoteNumber, HEADER_RIGHT_COL_X + HEADER_RIGHT_COL_WIDTH - 2.2, HEADER_QUOTE_BOX_TOP + 5.4, { align: 'right' });
    pdf.text('Date', HEADER_RIGHT_COL_X + 2.2, HEADER_QUOTE_BOX_TOP + 11.3);
    pdf.text(quoteDate, HEADER_RIGHT_COL_X + HEADER_RIGHT_COL_WIDTH - 2.2, HEADER_QUOTE_BOX_TOP + 11.3, { align: 'right' });
    pdf.setDrawColor(219, 228, 240);
    pdf.line(12, CONTINUATION_TABLE_START_Y - 4, 198, CONTINUATION_TABLE_START_Y - 4);
    return CONTINUATION_TABLE_START_Y - 4;
  }

  pdf.setFontSize(5.7);
  pdf.text('Quotation #', HEADER_RIGHT_COL_X + 2.2, HEADER_QUOTE_BOX_TOP + 5.4);
  pdf.text(quoteNumber, HEADER_RIGHT_COL_X + HEADER_RIGHT_COL_WIDTH - 2.2, HEADER_QUOTE_BOX_TOP + 5.4, { align: 'right' });
  pdf.text('Date', HEADER_RIGHT_COL_X + 2.2, HEADER_QUOTE_BOX_TOP + 11.3);
  pdf.text(quoteDate, HEADER_RIGHT_COL_X + HEADER_RIGHT_COL_WIDTH - 2.2, HEADER_QUOTE_BOX_TOP + 11.3, { align: 'right' });

  pdf.setFontSize(16);
  pdf.text('Quotation', 12, 70);

  const leftLabelX = 16;
  const leftValueX = 31;
  const rightLabelX = 110;
  const rightValueX = 126;
  const leftValueWidth = 68;
  const rightValueWidth = 66;
  const addressValueLines = pdf.splitTextToSize(String(customer.address || 'N/A'), leftValueWidth);
  const emailValueLines = pdf.splitTextToSize(String(customer.email || 'N/A'), rightValueWidth);
  const leftTextBottom = 97 + Math.max(0, addressValueLines.length - 1) * 4.2;
  const rightTextBottom = Math.max(97, 92 + Math.max(0, emailValueLines.length - 1) * 4.2);
  const billToTextBottom = Math.max(leftTextBottom, rightTextBottom);
  const billToBoxHeight = Math.max(24, billToTextBottom - 74 + 6);

  pdf.setFillColor(249, 250, 251);
  pdf.setDrawColor(229, 231, 235);
  pdf.roundedRect(12, 74, 186, billToBoxHeight, 3, 3, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 58, 138);
  pdf.setFontSize(10);
  pdf.text('Bill To', leftLabelX, 81);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(55, 65, 81);
  pdf.setFontSize(8.5);
  pdf.text('Name:', leftLabelX, 87);
  pdf.text(String(customer.name || 'N/A'), leftValueX, 87);
  pdf.text('Phone:', rightLabelX, 87);
  pdf.text(String(customer.phone || 'N/A'), rightValueX, 87);

  pdf.text('Company:', leftLabelX, 92);
  pdf.text(String(customer.company || 'N/A'), leftValueX, 92);
  pdf.text('Email:', rightLabelX, 92);
  pdf.text(emailValueLines, rightValueX, 92, { maxWidth: rightValueWidth, lineHeightFactor: 1.08 });

  pdf.text('Address:', leftLabelX, 97);
  pdf.text(addressValueLines, leftValueX, 97, { maxWidth: leftValueWidth, lineHeightFactor: 1.08 });
  pdf.text('Valid Until:', rightLabelX, 97);
  pdf.text(String(validUntil), rightValueX, 97);

  pdf.setDrawColor(219, 228, 240);
  const dividerY = 74 + billToBoxHeight + 8;
  pdf.line(12, dividerY, 198, dividerY);
  return dividerY;
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
  const pdf = new jsPDF('p', 'mm', 'a4');
  await ensureAmiriFont(pdf);
  const arabicHeaderImages = await loadArabicHeaderImages(settings);
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

  let pageNumber = 1;
  const firstPageDividerY = drawHeader(pdf, quote, settings, pageNumber, true, arabicHeaderImages);

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
    startY: Math.max(FIRST_PAGE_TABLE_START_Y, firstPageDividerY + 3),
    margin: { left: 12, right: 12, top: CONTINUATION_TABLE_START_Y, bottom: 24 },
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
      1: { cellWidth: 34, halign: 'left' },
      2: { cellWidth: 68 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 27, halign: 'right' },
      5: { cellWidth: 32, halign: 'right' },
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        pageNumber = data.pageNumber;
        drawHeader(pdf, quote, settings, pageNumber, false, arabicHeaderImages);
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
      drawCurrencyValue(pdf, text, rightX, centerY, { align: 'right', iconDataUrl: riyalSymbolImage, iconW: 3.4, iconH: 3.4, gap: 1 });
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        data.cell.styles.fontSize = 8.1;
        data.cell.styles.overflow = 'linebreak';
      }
    },
  });

  let currentY = (pdf as any).lastAutoTable.finalY + 6;
  const pageHeight = pdf.internal.pageSize.getHeight();

  const ensureSpace = (requiredHeight: number) => {
    if (currentY + requiredHeight <= pageHeight - PAGE_FOOTER_TOP_MARGIN) {
      return;
    }
    pdf.addPage();
    pageNumber += 1;
    drawHeader(pdf, quote, settings, pageNumber, false, arabicHeaderImages);
    drawFooter(pdf);
    currentY = CONTINUATION_TABLE_START_Y;
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

  const termsTextLines = termsLines.length ? termsLines : ['Payment terms: 30 days from invoice date'];
  const normalizedTerms = termsTextLines.map((line) => line.replace(/\r/g, '').trim()).filter(Boolean);
  const contactHeading = pointOfContact.title || 'Smart Universe : Primary Contact of this Project';
  const bankingLines = [
    `Bank: ${bankingDetails.bankName || 'Saudi National Bank'}`,
    `IBAN: ${bankingDetails.iban || 'SA3610000041000000080109'}`,
    `Account Number: ${bankingDetails.accountNumber || '41000000080109'}`,
  ];
  const contactLines = [
    `Name: ${pointOfContact.name || 'N/A'}`,
    `Designation: ${pointOfContact.designation || 'N/A'}`,
    `Mobily Number: ${pointOfContact.mobileNumber || 'N/A'}`,
    `Email Address: ${pointOfContact.emailAddress || 'N/A'}`,
  ];
  pdf.addPage();
  pageNumber += 1;
  drawHeader(pdf, quote, settings, pageNumber, false, arabicHeaderImages);
  drawFooter(pdf);

  const boxTop = CONTINUATION_TABLE_START_Y;
  const availablePageBottom = pageHeight - PAGE_FOOTER_TOP_MARGIN;
  const leftX = 12;
  const gap = 4;
  const leftBoxWidth = 100;
  const rightBoxWidth = 82;
  const rightX = leftX + leftBoxWidth + gap;
  const cardPadding = 4;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.4);
  const wrappedTerms = normalizedTerms.flatMap((line) => pdf.splitTextToSize(line, leftBoxWidth - cardPadding * 2));
  pdf.setFontSize(6.6);
  const wrappedBanking = bankingLines.flatMap((line) => pdf.splitTextToSize(line, rightBoxWidth - cardPadding * 2));
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.1);
  const wrappedContactHeading = pdf.splitTextToSize(contactHeading, rightBoxWidth - cardPadding * 2);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.6);
  const wrappedContact = contactLines.flatMap((line) => pdf.splitTextToSize(line, rightBoxWidth - cardPadding * 2));

  const termsLineHeight = 3.05;
  const infoLineHeight = 3.55;
  const availableHeight = availablePageBottom - boxTop;
  const termsHeight = Math.min(availableHeight, wrappedTerms.length * termsLineHeight + 13.5);
  const infoHeight = Math.min(
    availableHeight,
    wrappedBanking.length * infoLineHeight + wrappedContactHeading.length * 4.1 + wrappedContact.length * infoLineHeight + 22
  );

  pdf.setFillColor(251, 252, 254);
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.45);
  pdf.roundedRect(leftX, boxTop, leftBoxWidth, termsHeight, 2.5, 2.5, 'FD');
  pdf.roundedRect(rightX, boxTop, rightBoxWidth, infoHeight, 2.5, 2.5, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 64, 175);
  pdf.setFontSize(10);
  pdf.text('Terms & Conditions', leftX + cardPadding, boxTop + 6);
  pdf.text('Banking Details', rightX + cardPadding, boxTop + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(55, 65, 81);
  pdf.setFontSize(6.4);
  pdf.text(wrappedTerms, leftX + cardPadding, boxTop + 11, {
    maxWidth: leftBoxWidth - cardPadding * 2,
    lineHeightFactor: 1.08,
  });
  let infoY = boxTop + 11;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(55, 65, 81);
  pdf.setFontSize(6.6);
  pdf.text(wrappedBanking, rightX + cardPadding, infoY, {
    maxWidth: rightBoxWidth - cardPadding * 2,
    lineHeightFactor: 1.1,
  });
  infoY += wrappedBanking.length * infoLineHeight + 3;
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 64, 175);
  pdf.setFontSize(7.1);
  pdf.text(wrappedContactHeading, rightX + cardPadding, infoY, {
    maxWidth: rightBoxWidth - cardPadding * 2,
    lineHeightFactor: 1.08,
  });
  infoY += wrappedContactHeading.length * 4.1 + 2.2;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(55, 65, 81);
  pdf.setFontSize(6.6);
  pdf.text(wrappedContact, rightX + cardPadding, infoY, {
    maxWidth: rightBoxWidth - cardPadding * 2,
    lineHeightFactor: 1.1,
  });

  return pdf.output('blob');
}
