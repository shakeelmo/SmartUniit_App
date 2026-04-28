import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { SMART_UNIVERSE_LOGO_BASE64 } from './logoBase64';

const SAUDI_RIYAL_SYMBOL_ENTITY = '&#xea;';

function escapeHtml(value: any): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
      const unitPrice = Number(item.unitPrice || 0);
      const total = Number(item.total || quantity * unitPrice || 0);
      const name = String(item.name || item.description || '').trim();
      return { ...item, quantity, unitPrice, total, name };
    })
    .filter((item: any) => item.name && item.quantity > 0);

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

  const termsText = Array.isArray(quote.terms)
    ? quote.terms.join('<br/>')
    : escapeHtml(quote.terms || 'Payment terms: 30 days from invoice date');

  const rowsHtml = lineItems.length
    ? lineItems
        .map(
          (item: any, index: number) => `
            <tr>
              <td class="center">${index + 1}</td>
              <td>${escapeHtml(item.itemCode || item.code || item.sku || item.partNumber || '')}</td>
              <td>${escapeHtml(item.description || item.name || '')}</td>
              <td class="center">${escapeHtml(item.quantity)}</td>
              <td class="money"><span class="sar icon-saudi_riyal">${SAUDI_RIYAL_SYMBOL_ENTITY}</span>${formatCurrency(item.unitPrice)}</td>
              <td class="money total-cell"><span class="sar icon-saudi_riyal">${SAUDI_RIYAL_SYMBOL_ENTITY}</span>${formatCurrency(item.total)}</td>
            </tr>`
        )
        .join('')
    : `
      <tr>
        <td colspan="6" class="empty">No items to display</td>
      </tr>`;

  const html = `
    <div id="quotation-pdf-root" style="width: 1120px; min-height: 1580px; background: #ffffff; color: #111827; font-family: Arial, Helvetica, sans-serif; padding: 36px 44px 28px; box-sizing: border-box; display: flex; flex-direction: column;">
      <style>
        @import '@abdulrysr/saudi-riyal-new-symbol-font/style.css';
        .header { display: flex; justify-content: space-between; align-items: stretch; gap: 10px; border-bottom: 3px solid #dbe4f0; padding-bottom: 18px; position: relative; }
        .header::after { content: ''; position: absolute; left: 0; right: 0; bottom: -3px; height: 1px; background: #1e40af; opacity: 0.18; }
        .left { width: 56%; display: flex; gap: 16px; }
        .logo { width: 92px; height: 92px; object-fit: contain; border-radius: 18px; background: #ffffff; box-shadow: 0 4px 18px rgba(30, 64, 175, 0.08); }
        .brand { flex: 1; padding-top: 2px; }
        .brand h1 { margin: 0; font-size: 34px; line-height: 1.01; color: #1d4ed8; letter-spacing: 0.1px; }
        .brand h2 { margin: 8px 0 14px; font-size: 18px; line-height: 1.2; color: #1d4ed8; font-weight: 700; text-transform: uppercase; max-width: 430px; }
        .brand p { margin: 6px 0; font-size: 16px; color: #374151; }
        .right { width: 44%; display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; }
        .ar-block { width: 100%; text-align: right; direction: rtl; font-family: 'Tahoma', 'Arial', sans-serif; background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%); border: 1px solid #dbe4f0; border-radius: 16px; padding: 14px 18px 12px; box-sizing: border-box; max-width: 430px; }
        .ar-name { color: #1e40af; font-weight: 700; font-size: 32px; line-height: 1.18; margin: 0; }
        .ar-meta-wrap { margin-top: 14px; padding-top: 12px; border-top: 1px solid #cfd8e3; }
        .ar-meta { color: #374151; font-size: 18px; line-height: 1.75; font-weight: 700; margin: 0; }
        .quote-card { margin-top: 14px; width: 100%; max-width: 320px; border: 1px solid #dbe4f0; border-radius: 16px; background: #f8fafc; position: relative; box-sizing: border-box; box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06); overflow: hidden; }
        .quote-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 8px; background: linear-gradient(180deg, #2563eb 0%, #1e40af 100%); }
        .quote-card-inner { padding: 16px 18px 14px 22px; }
        .quote-row { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 12px; font-size: 14px; }
        .quote-row:last-child { margin-bottom: 0; }
        .quote-label { color: #111827; font-weight: 700; }
        .quote-value { color: #1e40af; font-weight: 700; text-align: right; }
        .document-title { margin: 18px 0 6px; color: #1e40af; font-size: 28px; font-weight: 700; }
        .section-title { margin: 24px 0 10px; color: #1e40af; font-size: 18px; font-weight: 700; }
        .customer-box { border: 1px solid #e5e7eb; border-radius: 14px; background: #fcfcfd; padding: 16px 18px; margin-bottom: 18px; }
        .customer-box p { margin: 5px 0; font-size: 13px; color: #374151; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; overflow: hidden; border-radius: 14px; }
        thead th { background: linear-gradient(180deg, #2563eb 0%, #1e40af 100%); color: #ffffff; padding: 13px 10px; font-size: 13px; border: 1px solid #dbe4f0; }
        tbody td { border: 1px solid #d1d5db; padding: 11px 10px; font-size: 13px; color: #1f2937; vertical-align: middle; }
        tbody tr:nth-child(even) { background: #f9fafb; }
        .center { text-align: center; }
        .money { text-align: right; white-space: nowrap; font-weight: 600; }
        .total-cell { font-weight: 700; }
        .sar { display: inline-block; margin-right: 8px; color: #1e40af; font-size: 18px; line-height: 1; vertical-align: -1px; }
        .empty { text-align: center; color: #6b7280; font-style: italic; }
        .totals { width: 380px; margin-left: auto; margin-top: 18px; border-top: 3px solid #1e40af; padding-top: 12px; }
        .totals-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; font-size: 14px; }
        .totals-row .label { font-weight: 700; color: #374151; }
        .totals-row .value { font-weight: 700; color: #111827; }
        .totals-row.grand { margin-top: 4px; padding-top: 12px; border-top: 1px dashed #cbd5e1; }
        .totals-row.grand .label, .totals-row.grand .value { color: #1e40af; font-size: 18px; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
        .terms { border: 1px solid #e5e7eb; border-radius: 14px; background: #fafafa; padding: 16px 18px; min-height: 100%; box-sizing: border-box; }
        .terms p { margin: 0 0 6px; font-size: 13px; color: #374151; line-height: 1.7; white-space: pre-wrap; }
        .terms p:last-child { margin-bottom: 0; }
        .content-grow { flex: 1; }
        .footer { margin-top: 30px; background: linear-gradient(180deg, #1f2937 0%, #111827 100%); color: #ffffff; padding: 18px 22px; text-align: center; font-size: 12px; border-radius: 14px; }
        .footer strong { display: block; font-size: 14px; margin-bottom: 6px; }
      </style>

      <div class="header">
        <div class="left">
          <img class="logo" src="${SMART_UNIVERSE_LOGO_BASE64}" alt="Smart Universe" />
          <div class="brand">
            <h1>Smart Universe</h1>
            <h2>for Communications and<br/>Information Technology</h2>
            <p>${escapeHtml(companyInfo.address || 'Office # 3 In, Al Dirah Dist, P.O.Box 12633, Riyadh - 11461 KSA')}</p>
            <p>Tel: ${escapeHtml(companyInfo.phone || '011-4917295')}</p>
            <p>VAT: 314076518400003</p>
            <p>CR: 1010973808</p>
          </div>
        </div>

        <div class="right">
          <div class="ar-block">
            <p class="ar-name">شركة الكون الذكي</p>
            <p class="ar-name">للاتصالات و تقنية</p>
            <p class="ar-name">المعلومات</p>
            <div class="ar-meta-wrap">
              <p class="ar-meta">رقم الضريبة المضافة: ٣١٤٠٧٦٥١٨٤٠٠٠٠٣</p>
              <p class="ar-meta">السجل التجاري: ١٠١٠٩٧٣٨٠٨</p>
            </div>
          </div>

          <div class="quote-card">
            <div class="quote-card-inner">
              <div class="quote-row">
                <div class="quote-label">Quotation #:</div>
                <div class="quote-value">${escapeHtml(quoteNumber)}</div>
              </div>
              <div class="quote-row">
                <div class="quote-label">Date:</div>
                <div class="quote-value">${escapeHtml(quoteDate)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="content-grow">
        <div class="document-title">Quotation:</div>
        <div class="section-title">Bill To</div>
        <div class="customer-box">
          <p><strong>Name:</strong> ${escapeHtml(customer.name || 'N/A')}</p>
          <p><strong>Company:</strong> ${escapeHtml(customer.company || 'N/A')}</p>
          <p><strong>Address:</strong> ${escapeHtml(customer.address || 'N/A')}</p>
          <p><strong>Phone:</strong> ${escapeHtml(customer.phone || 'N/A')}</p>
          <p><strong>Email:</strong> ${escapeHtml(customer.email || 'N/A')}</p>
          <p><strong>Valid Until:</strong> ${escapeHtml(validUntil)}</p>
        </div>

        <div class="section-title">Items & Services</div>
        <table>
        <thead>
          <tr>
            <th style="width: 7%;">S#</th>
            <th style="width: 20%;">Item</th>
            <th style="width: 31%;">Description</th>
            <th style="width: 10%;">Qty</th>
            <th style="width: 16%;">Unit Price</th>
            <th style="width: 16%;">Total</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>

      <div class="totals">
        <div class="totals-row"><div class="label">Subtotal</div><div class="value"><span class="sar icon-saudi_riyal">${SAUDI_RIYAL_SYMBOL_ENTITY}</span>${formatCurrency(subtotal)}</div></div>
        ${discountAmount > 0 ? `<div class="totals-row"><div class="label">Discount${discountType === 'percentage' ? ` (${escapeHtml(discountValue)}%)` : ''}</div><div class="value"><span class="sar icon-saudi_riyal">${SAUDI_RIYAL_SYMBOL_ENTITY}</span>-${formatCurrency(discountAmount)}</div></div>` : ''}
        <div class="totals-row"><div class="label">VAT (${escapeHtml(vatRate)}%)</div><div class="value"><span class="sar icon-saudi_riyal">${SAUDI_RIYAL_SYMBOL_ENTITY}</span>${formatCurrency(vatAmount)}</div></div>
        <div class="totals-row grand"><div class="label">Total</div><div class="value"><span class="sar icon-saudi_riyal">${SAUDI_RIYAL_SYMBOL_ENTITY}</span>${formatCurrency(total)}</div></div>
      </div>

        <div class="details-grid">
          <div class="terms">
            <div class="section-title" style="margin-top:0; margin-bottom:10px; font-size:16px;">Terms & Conditions</div>
            <p>${termsText}</p>
          </div>

          <div class="terms">
            <div class="section-title" style="margin-top:0; margin-bottom:10px; font-size:16px;">Banking Details</div>
            <p><strong>Bank:</strong> ${escapeHtml(bankingDetails.bankName || 'Saudi National Bank')}</p>
            <p><strong>IBAN:</strong> ${escapeHtml(bankingDetails.iban || 'SA3610000041000000080109')}</p>
            <p><strong>Account Number:</strong> ${escapeHtml(bankingDetails.accountNumber || '41000000080109')}</p>
          </div>
        </div>
      </div>

      <div class="footer">
        <strong>Smart Universe for Communications and Information Technology</strong>
        Riyadh, Saudi Arabia | Phone: +966 11 4917295 | Email: info@smartuniit.com
      </div>
    </div>`;

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = '1120px';
  container.style.background = '#ffffff';
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const root = container.firstElementChild as HTMLElement;
    const canvas = await html2canvas(root, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const renderWidth = imgWidth * ratio;
    const renderHeight = imgHeight * ratio;
    const x = (pdfWidth - renderWidth) / 2;
    const y = 0;

    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, renderWidth, renderHeight);
    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}
