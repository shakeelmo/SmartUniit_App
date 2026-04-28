import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function formatCurrency(amount: number): string {
  return Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export async function generateQuotationPDF(quote: any, settings: any = {}) {
  const lineItems = (quote.lineItems || [])
    .map((item: any) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice ?? item.unit_price ?? 0);
      const total = Number(item.total ?? item.total_price ?? (quantity * unitPrice) ?? 0);
      return {
        ...item,
        quantity,
        unitPrice,
        total,
        itemCode: item.itemCode || item.item_code || item.code || item.sku || item.partNumber || '',
        description: item.description || item.name || '',
      };
    })
    .filter((item: any) => (item.description || item.itemCode) && item.quantity > 0);

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

  const customer = quote.customer || {};
  const companyInfo = settings?.companyInfo || {};
  const bankingDetails = companyInfo.bankingDetails || {};
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

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const rightX = pageWidth - 14;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(29, 78, 216);
  pdf.text('Smart Universe', 14, 16);

  pdf.setFontSize(11);
  pdf.text('FOR COMMUNICATIONS AND INFORMATION TECHNOLOGY', 14, 22);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(55, 65, 81);
  pdf.setFontSize(9);
  pdf.text(companyInfo.address || 'Office # 3 ln, Al Dirah Dist, P.O.Box 12633, Riyadh - 11461 KSA', 14, 28);
  pdf.text(`Tel: ${companyInfo.phone || '011-4917295'}`, 14, 33);
  pdf.text('VAT: 314076518400003', 14, 38);
  pdf.text('CR: 1010973808', 14, 43);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(30, 64, 175);
  pdf.text('QUOTATION', rightX, 18, { align: 'right' });

  pdf.setFontSize(9);
  pdf.setTextColor(17, 24, 39);
  pdf.text(`Quotation #: ${quoteNumber}`, rightX, 26, { align: 'right' });
  pdf.text(`Date: ${quoteDate}`, rightX, 31, { align: 'right' });
  pdf.text(`Valid Until: ${validUntil}`, rightX, 36, { align: 'right' });

  pdf.setDrawColor(219, 228, 240);
  pdf.line(14, 48, pageWidth - 14, 48);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(30, 64, 175);
  pdf.text('Bill To', 14, 57);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(55, 65, 81);
  pdf.setFontSize(9);
  const customerLines = [
    `Name: ${customer.name || 'N/A'}`,
    `Company: ${customer.company || 'N/A'}`,
    `Address: ${customer.address || 'N/A'}`,
    `Phone: ${customer.phone || 'N/A'}`,
    `Email: ${customer.email || 'N/A'}`,
  ];
  customerLines.forEach((line, index) => pdf.text(line, 14, 63 + index * 5));

  autoTable(pdf, {
    startY: 92,
    head: [['S#', 'Item', 'Description', 'Qty', 'Unit Price', 'Total']],
    body: lineItems.length
      ? lineItems.map((item: any, index: number) => [
          String(index + 1),
          item.itemCode || '',
          item.description || '',
          String(item.quantity),
          formatCurrency(item.unitPrice),
          formatCurrency(item.total),
        ])
      : [['', '', 'No items to display', '', '', '']],
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      lineColor: [209, 213, 219],
      lineWidth: 0.1,
      textColor: [31, 41, 55],
    },
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { cellWidth: 34 },
      2: { cellWidth: 68 },
      3: { halign: 'center', cellWidth: 16 },
      4: { halign: 'right', cellWidth: 28 },
      5: { halign: 'right', cellWidth: 28 },
    },
  });

  const finalY = (pdf as any).lastAutoTable?.finalY || 100;
  let y = finalY + 10;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(17, 24, 39);
  pdf.text(`Subtotal: ${formatCurrency(subtotal)}`, rightX, y, { align: 'right' });
  y += 5;
  if (discountAmount > 0) {
    pdf.text(
      `Discount${discountType === 'percentage' ? ` (${discountValue}%)` : ''}: -${formatCurrency(discountAmount)}`,
      rightX,
      y,
      { align: 'right' }
    );
    y += 5;
  }
  pdf.text(`VAT (${vatRate}%): ${formatCurrency(vatAmount)}`, rightX, y, { align: 'right' });
  y += 6;

  pdf.setFontSize(12);
  pdf.setTextColor(30, 64, 175);
  pdf.text(`Total: ${formatCurrency(total)}`, rightX, y, { align: 'right' });

  y += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(30, 64, 175);
  pdf.text('Terms & Conditions', 14, y);
  pdf.text('Banking Details', pageWidth / 2 + 6, y);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(55, 65, 81);

  const termsText = Array.isArray(quote.terms)
    ? quote.terms.join('\n')
    : (quote.terms || 'Payment terms: 30 days from invoice date');
  const termsLines = pdf.splitTextToSize(termsText, 82);
  pdf.text(termsLines, 14, y + 5);

  const bankLines = [
    `Bank: ${bankingDetails.bankName || 'Saudi National Bank'}`,
    `IBAN: ${bankingDetails.iban || 'SA3610000041000000080109'}`,
    `Account Number: ${bankingDetails.accountNumber || '41000000080109'}`,
  ];
  pdf.text(bankLines, pageWidth / 2 + 6, y + 5);

  return pdf.output('blob');
}
