import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import amiriFontUrl from '../../Amiri-Regular.ttf?url';
import { SMART_UNIVERSE_LOGO_BASE64 } from './logoBase64';
import { PurchaseOrder } from '../types/purchaseOrder';
import { formatCurrency } from './format';

type Counterparty = {
  name?: string;
  company?: string;
  address?: string;
  phone?: string;
  email?: string;
};

const COMPANY_INFO = {
  displayName: 'Smart Universe',
  legalName: 'Smart Universe Communication and Information Technology',
  arabicName: 'شركة الكون الذكي للاتصالات و تقنية المعلومات',
  address: 'Office # 3 ln, Al Dirah Dist, P.O.Box 12633, Riyadh - 11461 KSA',
  addressAr: 'مكتب رقم 3، حي الديرة، ص.ب 12633، الرياض 11461، المملكة العربية السعودية',
  vat: '314076518400003',
  cr: '1010973808',
  phone: '011-4917295',
  email: 'info@smartuniit.com',
};

const HEADER_HEIGHT = 66;
const FOOTER_HEIGHT = 14;
const PAGE_MARGIN_X = 14;
const PARTY_BLOCK_Y = 78;
const TABLE_BOTTOM_MARGIN = 24;
const TOTAL_PAGES_TOKEN = '{total_pages_count_string}';

let amiriFontReadyPromise: Promise<void> | null = null;
let arabicHeaderImagePromise: Promise<string | undefined> | null = null;
let riyalSymbolImagePromise: Promise<string | undefined> | null = null;

const money = (amount: number, currency = 'SAR') => `${currency} ${formatCurrency(amount, currency)}`;

function formatCurrencyAmount(amount: number): string {
  return Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

async function loadArabicHeaderImage(): Promise<string | undefined> {
  if (arabicHeaderImagePromise) return arabicHeaderImagePromise;
  if (typeof document === 'undefined') return undefined;

  arabicHeaderImagePromise = (async () => {
    try {
      const font = new FontFace('AmiriCanvas', `url(${amiriFontUrl})`);
      await font.load();
      (document as any).fonts?.add(font);
      await (document as any).fonts?.ready;
    } catch {
      // Keep going with fallback fonts if needed.
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1700;
    canvas.height = 380;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'right';
    ctx.direction = 'rtl';

    const lines = [
      { text: COMPANY_INFO.arabicName, size: 94, color: '#1e40af', weight: 700 },
      { text: COMPANY_INFO.addressAr, size: 52, color: '#374151', weight: 400 },
      { text: `رقم الضريبة المضافة: ${COMPANY_INFO.vat}`, size: 56, color: '#374151', weight: 700 },
      { text: `السجل التجاري: ${COMPANY_INFO.cr}`, size: 56, color: '#374151', weight: 700 },
    ];

    let y = 100;
    for (const line of lines) {
      ctx.font = `${line.weight} ${line.size}px "AmiriCanvas", "Amiri", "Tahoma", sans-serif`;
      ctx.fillStyle = line.color;
      ctx.fillText(line.text, canvas.width - 12, y);
      y += line.size + 12;
    }

    return canvas.toDataURL('image/png');
  })();

  return arabicHeaderImagePromise;
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
  doc: jsPDF,
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
    const amountWidth = doc.getTextWidth(amountText);
    const startX = x - amountWidth - gap - iconW;
    if (iconDataUrl) {
      try {
        doc.addImage(iconDataUrl, 'PNG', startX, y - 2.6, iconW, iconH, undefined, 'FAST');
      } catch {
        doc.text('SAR', startX, y);
      }
    } else {
      doc.text('SAR', startX, y);
    }
    doc.text(amountText, x, y, { align: 'right' });
    return;
  }

  if (iconDataUrl) {
    try {
      doc.addImage(iconDataUrl, 'PNG', x, y - 2.6, iconW, iconH, undefined, 'FAST');
    } catch {
      doc.text('SAR', x, y);
    }
  } else {
    doc.text('SAR', x, y);
  }
  doc.text(amountText, x + iconW + gap, y, { align: 'left' });
}

const drawFooter = (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor(220, 226, 237);
  doc.line(PAGE_MARGIN_X, pageHeight - FOOTER_HEIGHT, pageWidth - PAGE_MARGIN_X, pageHeight - FOOTER_HEIGHT);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(
    `Smart Universe for Communications and Information Technology | Tel: ${COMPANY_INFO.phone} | ${COMPANY_INFO.email}`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );
};

const drawPartyBlock = (
  doc: jsPDF,
  title: string,
  x: number,
  y: number,
  width: number,
  details: Counterparty
) => {
  const lines = [
    details.name && `Name: ${details.name}`,
    details.company && `Company: ${details.company}`,
    details.address && `Address: ${details.address}`,
    details.phone && `Phone: ${details.phone}`,
    details.email && `Email: ${details.email}`,
  ].filter(Boolean) as string[];

  let contentHeight = 0;
  lines.forEach((line) => {
    contentHeight += doc.splitTextToSize(line, width - 10).length * 4.2;
  });

  const boxHeight = Math.max(34, 14 + contentHeight + 6);

  doc.setDrawColor(220, 226, 237);
  doc.roundedRect(x, y, width, boxHeight, 3, 3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(37, 64, 173);
  doc.text(title, x + 4, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(55, 65, 81);

  let cursorY = y + 14;
  lines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, width - 10);
    doc.text(wrapped, x + 4, cursorY);
    cursorY += wrapped.length * 4.2;
  });

  return boxHeight;
};

function drawHeader(doc: jsPDF, purchaseOrder: PurchaseOrder, arabicHeaderImage?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
  const logoX = PAGE_MARGIN_X;
  const logoY = 14;
  const logoW = 22;
  const logoH = 22;
  const leftTextX = logoX + logoW + 5;
  const leftTextWidth = 62;
  const rightColX = 121;
  const rightColW = 75;

  doc.setR2L(false);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(75, 85, 99);
  doc.text(`Page ${pageNumber} of ${TOTAL_PAGES_TOKEN}`, pageWidth - PAGE_MARGIN_X, 10.5, { align: 'right' });

  try {
    doc.addImage(SMART_UNIVERSE_LOGO_BASE64, 'JPEG', logoX, logoY, logoW, logoH, undefined, 'FAST');
  } catch {
    // Logo is decorative here; continue even if it fails.
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.2);
  doc.setTextColor(30, 64, 175);
  const companyNameLines = doc.splitTextToSize(COMPANY_INFO.legalName, leftTextWidth);
  const trimmedCompanyNameLines = companyNameLines.slice(0, 3);
  doc.text(trimmedCompanyNameLines, leftTextX, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.7);
  doc.setTextColor(55, 65, 81);
  const addressLines = doc.splitTextToSize(COMPANY_INFO.address, leftTextWidth).slice(0, 3);
  const companyBlockBottomY = 18 + trimmedCompanyNameLines.length * 5.4;
  const addressTopY = companyBlockBottomY + 2.8;
  doc.text(addressLines, leftTextX, addressTopY);
  const addressBottomY = addressTopY + Math.max(addressLines.length - 1, 0) * 4.3;
  doc.text(`Tel: ${COMPANY_INFO.phone}`, leftTextX, addressBottomY + 6.5);
  doc.text(`VAT: ${COMPANY_INFO.vat}`, leftTextX, addressBottomY + 11.7);
  doc.text(`CR: ${COMPANY_INFO.cr}`, leftTextX, addressBottomY + 16.9);

  doc.setDrawColor(219, 234, 254);
  doc.roundedRect(rightColX, 14, rightColW, 28, 5, 5);

  if (arabicHeaderImage) {
    try {
      doc.addImage(arabicHeaderImage, 'PNG', rightColX + 3, 16, rightColW - 6, 21, undefined, 'FAST');
    } catch {
      doc.setFont('Amiri', 'normal');
      doc.setR2L(true);
      doc.setFontSize(18);
      doc.setTextColor(30, 64, 175);
      doc.text(COMPANY_INFO.arabicName, rightColX + rightColW - 4, 24, { align: 'right' });
      doc.setFontSize(11);
      doc.setTextColor(55, 65, 81);
      doc.text(COMPANY_INFO.addressAr, rightColX + rightColW - 4, 31, { align: 'right', maxWidth: rightColW - 8 });
      doc.setTextColor(55, 65, 81);
      doc.text(`رقم الضريبة المضافة: ${COMPANY_INFO.vat}`, rightColX + rightColW - 4, 37, { align: 'right' });
      doc.setR2L(false);
      doc.setFont('helvetica', 'normal');
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(17, 24, 39);
  doc.text('PURCHASE ORDER', PAGE_MARGIN_X, 70);

  doc.setDrawColor(220, 226, 237);
  doc.roundedRect(pageWidth - 59, 49, 45, 17, 4, 4);
  doc.setFontSize(8.8);
  doc.setTextColor(37, 64, 173);
  doc.text('PO Number', pageWidth - 55, 55);
  doc.text('Date', pageWidth - 55, 62);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(8.2);
  doc.text(purchaseOrder.poNumber, pageWidth - 16.5, 55, { align: 'right' });
  doc.text(format(purchaseOrder.poDate, 'dd MMM yyyy'), pageWidth - 16.5, 62, { align: 'right' });
}

export async function generatePurchaseOrderPDF(purchaseOrder: PurchaseOrder) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  await ensureAmiriFont(doc);
  const arabicHeaderImage = await loadArabicHeaderImage();
  const riyalSymbolImage = await loadRiyalSymbolImage();

  const vendor = purchaseOrder.vendor || {};
  const customer = purchaseOrder.customer || {};

  const leftParty =
    purchaseOrder.direction === 'received'
      ? {
          name: customer.name,
          company: customer.company,
          address: customer.address,
          phone: customer.phone,
          email: customer.email,
        }
      : {
          name: vendor.contactPerson || vendor.name,
          company: vendor.name,
          address: vendor.address,
          phone: vendor.phone,
          email: vendor.email,
        };

  const rightParty =
    purchaseOrder.direction === 'received'
      ? {
          name: purchaseOrder.companyContactName || COMPANY_INFO.displayName,
          company: COMPANY_INFO.legalName,
          address: COMPANY_INFO.address,
          phone: purchaseOrder.companyContactPhone || COMPANY_INFO.phone,
          email: purchaseOrder.companyContactEmail || COMPANY_INFO.email,
        }
      : {
          name: customer.name,
          company: customer.company,
          address: customer.address,
          phone: customer.phone,
          email: customer.email,
        };

  drawHeader(doc, purchaseOrder, arabicHeaderImage);
  const leftHeight = drawPartyBlock(
    doc,
    purchaseOrder.direction === 'received' ? 'Received From' : 'Vendor',
    PAGE_MARGIN_X,
    PARTY_BLOCK_Y,
    88,
    leftParty
  );
  const rightHeight = drawPartyBlock(
    doc,
    purchaseOrder.direction === 'received' ? 'Received By' : 'Customer / Buyer',
    108,
    PARTY_BLOCK_Y,
    88,
    rightParty
  );

  let metaY = PARTY_BLOCK_Y + Math.max(leftHeight, rightHeight) + 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(55, 65, 81);
  if (purchaseOrder.referenceNumber) {
    doc.text(`Reference: ${purchaseOrder.referenceNumber}`, PAGE_MARGIN_X, metaY);
    metaY += 6;
  }
  if (purchaseOrder.quotationReference) {
    doc.text(`Quotation Ref: ${purchaseOrder.quotationReference}`, PAGE_MARGIN_X, metaY);
    metaY += 6;
  }

  autoTable(doc, {
    startY: metaY,
    head: [['S/N', 'Item Description', 'Qty', 'Unit Price', 'Total Price']],
    body: purchaseOrder.lineItems.map((item, index) => [
      String(index + 1),
      [item.itemCode, item.description].filter(Boolean).join('\n'),
      `${item.quantity} ${item.unit}`,
      '',
      '',
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      fontSize: 9.5,
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [220, 226, 237],
      lineWidth: 0.2,
      valign: 'middle',
      textColor: [31, 41, 55],
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' },
      1: { cellWidth: 98, halign: 'left' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 32, halign: 'right' },
    },
    willDrawCell: (data) => {
      if (data.section !== 'body') return;
      // These cells are drawn once below for reliable vertical centering.
      // Suppress AutoTable's default text to prevent blurred double printing.
      if (data.column.index === 0 || data.column.index === 2) {
        data.cell.text = [];
      }
    },
    didDrawCell: (data) => {
      if (data.section !== 'body') return;
      if (data.column.index === 0 || data.column.index === 2) {
        const item = purchaseOrder.lineItems[data.row.index];
        const cellValue = data.column.index === 0 ? String(data.row.index + 1) : `${item?.quantity || 0} ${item?.unit || ''}`.trim();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(31, 41, 55);
        doc.text(cellValue, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1.1, { align: 'center', baseline: 'middle' });
        return;
      }
      if (data.column.index !== 3 && data.column.index !== 4) return;
      const item = purchaseOrder.lineItems[data.row.index];
      const amount = data.column.index === 3 ? Number(item?.unitPrice || 0) : Number(item?.total || 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(31, 41, 55);
      drawCurrencyValue(doc, formatCurrencyAmount(amount), data.cell.x + data.cell.width - 2.6, data.cell.y + data.cell.height / 2 + 1.3, {
        align: 'right',
        iconDataUrl: riyalSymbolImage,
        iconW: 3.2,
        iconH: 3.2,
        gap: 0.8,
      });
    },
    didDrawPage: () => {
      drawHeader(doc, purchaseOrder, arabicHeaderImage);
      drawFooter(doc);
    },
    margin: { top: metaY, bottom: TABLE_BOTTOM_MARGIN },
  });

  const finalY = (doc as any).lastAutoTable.finalY || metaY + 20;
  const summaryX = 116;
  let summaryY = finalY + 10;
  const discountAmount = Number(purchaseOrder.discountAmount || 0);
  const hasDiscount = discountAmount > 0;
  const netBeforeVat = Math.max(Number(purchaseOrder.subtotal || 0) - discountAmount, 0);
  const summaryHeight = hasDiscount ? 44 : 28;

  if (summaryY + summaryHeight > pageHeight - FOOTER_HEIGHT - 6) {
    doc.addPage();
    drawHeader(doc, purchaseOrder, arabicHeaderImage);
    drawFooter(doc);
    summaryY = HEADER_HEIGHT + 8;
  }

  doc.setDrawColor(220, 226, 237);
  doc.roundedRect(summaryX, summaryY, 80, summaryHeight, 3, 3);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text(hasDiscount ? 'Subtotal Before Discount' : 'Subtotal in SAR', summaryX + 4, summaryY + 7);
  drawCurrencyValue(doc, formatCurrencyAmount(purchaseOrder.subtotal), summaryX + 76, summaryY + 7, { align: 'right', iconDataUrl: riyalSymbolImage, iconW: 3.2, iconH: 3.2, gap: 0.8 });
  let summaryLineY = summaryY + 15;
  if (hasDiscount) {
    doc.setTextColor(21, 128, 61);
    doc.text('Special Discount', summaryX + 4, summaryLineY);
    drawCurrencyValue(doc, `-${formatCurrencyAmount(discountAmount)}`, summaryX + 76, summaryLineY, { align: 'right', iconDataUrl: riyalSymbolImage, iconW: 3.2, iconH: 3.2, gap: 0.8 });
    summaryLineY += 8;
    doc.setTextColor(17, 24, 39);
    doc.text('Net Before VAT', summaryX + 4, summaryLineY);
    drawCurrencyValue(doc, formatCurrencyAmount(netBeforeVat), summaryX + 76, summaryLineY, { align: 'right', iconDataUrl: riyalSymbolImage, iconW: 3.2, iconH: 3.2, gap: 0.8 });
    summaryLineY += 8;
  }
  doc.setTextColor(17, 24, 39);
  doc.text(`VAT ${purchaseOrder.vatRate || 15}%`, summaryX + 4, summaryLineY);
  drawCurrencyValue(doc, formatCurrencyAmount(purchaseOrder.vatAmount), summaryX + 76, summaryLineY, { align: 'right', iconDataUrl: riyalSymbolImage, iconW: 3.2, iconH: 3.2, gap: 0.8 });
  summaryLineY += 8;
  doc.setTextColor(30, 64, 175);
  doc.text('Total Price with VAT in SAR', summaryX + 4, summaryLineY);
  drawCurrencyValue(doc, formatCurrencyAmount(purchaseOrder.total), summaryX + 76, summaryLineY, { align: 'right', iconDataUrl: riyalSymbolImage, iconW: 3.2, iconH: 3.2, gap: 0.8 });

  let notesY = summaryY + summaryHeight + 8;
  const notes = [
    purchaseOrder.deliveryAddress && `Delivery Address: ${purchaseOrder.deliveryAddress}`,
    purchaseOrder.paymentTerms && `Payment Terms: ${purchaseOrder.paymentTerms}`,
    purchaseOrder.notes && `Notes: ${purchaseOrder.notes}`,
  ].filter(Boolean) as string[];

  if (notes.length > 0) {
    const wrappedNotes = notes.map((line) => doc.splitTextToSize(line, pageWidth - PAGE_MARGIN_X * 2));
    const notesHeight = wrappedNotes.reduce((sum, wrapped) => sum + wrapped.length * 4.4, 0);
    const notesHeaderHeight = 9;
    const notesBottomSafety = FOOTER_HEIGHT + 10;

    if (notesY + notesHeaderHeight + notesHeight > pageHeight - notesBottomSafety) {
      doc.addPage();
      drawHeader(doc, purchaseOrder, arabicHeaderImage);
      drawFooter(doc);
      notesY = HEADER_HEIGHT + 8;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(37, 64, 173);
    doc.text('Additional Notes', PAGE_MARGIN_X, notesY);
    notesY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(55, 65, 81);
    wrappedNotes.forEach((wrapped) => {
      doc.text(wrapped, PAGE_MARGIN_X, notesY);
      notesY += wrapped.length * 4.4;
    });
  }

  drawFooter(doc);
  (doc as any).putTotalPages(TOTAL_PAGES_TOKEN);

  return doc.output('blob');
}
