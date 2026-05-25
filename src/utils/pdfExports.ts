import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
// User's exact Smart Universe logo - using the provided base64 data URL
const SMART_UNIVERSE_LOGO_BASE64 = "data:image/jpeg;base64,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";
import { SMART_UNIVERSE_LOGO_BASE64 as SHARED_SMART_UNIVERSE_LOGO } from './logoBase64';

const SAUDI_RIYAL_SYMBOL_ENTITY = '﷼';

// Common PDF generation utilities
export class PDFExportUtils {
  private static instance: PDFExportUtils;
  
  public static getInstance(): PDFExportUtils {
    if (!PDFExportUtils.instance) {
      PDFExportUtils.instance = new PDFExportUtils();
    }
    return PDFExportUtils.instance;
  }

  private async generatePDFFromHTML(htmlContent: string, filename: string): Promise<void> {
    // Create a temporary container for the PDF content
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '210mm'; // A4 width
    container.style.backgroundColor = 'white';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.fontSize = '12px';
    container.style.lineHeight = '1.4';
    container.style.color = '#000';
    container.innerHTML = htmlContent;
    
    // Append to body temporarily
    document.body.appendChild(container);
    
    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
      });
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Download the PDF
      pdf.save(filename);
    } finally {
      // Clean up
      document.body.removeChild(container);
    }
  }

  // Enhanced Proposal PDF Export with full document structure
  public async exportProposalPDF(proposal: any, customer: any): Promise<void> {
    const filename = `Proposal_${proposal?.title?.replace(/[^a-zA-Z0-9_-]+/g, '_') || proposal?.id || 'Draft'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    const htmlContent = this.generateProposalExportHTML(proposal, customer);
    await this.generatePDFFromHTML(htmlContent, filename);
  }

  private generateProposalExportHTML(proposal: any, customer: any): string {
    const rawDate = proposal?.createdAt || proposal?.created_at || proposal?.date || proposal?.documentControl?.date;
    const parsedDate = rawDate ? new Date(rawDate) : new Date();
    const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    const currency = proposal?.commercialProposal?.currency || 'SAR';
    const items = Array.isArray(proposal?.commercialProposal?.items) ? proposal.commercialProposal.items : [];

    const normalizedItems = items.length
      ? items
      : [{ serialNumber: 1, itemName: proposal?.title || 'Service', description: proposal?.description || 'Scope details', quantity: 1, unitPrice: Number(proposal?.commercialProposal?.total || 0), total: Number(proposal?.commercialProposal?.total || 0) }];

    const subtotal = Number(
      proposal?.commercialProposal?.subtotal ??
      normalizedItems.reduce((s: number, r: any) => s + Number(r?.total || 0), 0)
    );
    const discountPercent = Number(proposal?.commercialProposal?.discountPercent ?? proposal?.commercialProposal?.discountRate ?? 0);
    const discountAmount = Number(
      proposal?.commercialProposal?.discountAmount ??
      (discountPercent > 0 ? subtotal * discountPercent / 100 : 0)
    );
    const afterDiscount = subtotal - discountAmount;
    const vatRate = Number(proposal?.commercialProposal?.vatRate ?? 15);
    const vatAmount = Number(proposal?.commercialProposal?.vatAmount ?? (afterDiscount * vatRate / 100));
    const total = Number(proposal?.commercialProposal?.total ?? (afterDiscount + vatAmount));

    const money = (v: any) => `SAR ${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const terms = (proposal?.additionalConditions || []).map((c: any) => c?.condition).filter(Boolean);
    const paymentTerms = (proposal?.paymentTerms?.milestones || []).map((m: any) => `${m?.description || 'Payment milestone'} - ${m?.percentage || 0}%`).filter(Boolean);
    const termsList = [...terms, ...paymentTerms].slice(0, 6);

    return `
      <div style="width: 210mm; min-height: 297mm; padding: 10mm; box-sizing: border-box; background: #ffffff; font-family: Arial, Helvetica, sans-serif; color: #1f2937; font-size:12px; line-height:1.42;"><style>.money{white-space:nowrap;font-weight:600;font-variant-numeric:tabular-nums}</style>
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:8px;">
          <div style="display:flex; gap:10px; align-items:flex-start; flex:1;">
            <img src="${SHARED_SMART_UNIVERSE_LOGO}" style="width:74px; height:74px; object-fit:contain; border-radius:14px; background:#fff;" />
            <div>
              <div style="font-size:42px; line-height:1; color:#1d4ed8; font-weight:800;">Smart Universe</div>
              <div style="font-size:18px; line-height:1.15; color:#1d4ed8; font-weight:700; text-transform:uppercase;">FOR COMMUNICATIONS AND<br/>INFORMATION TECHNOLOGY</div>
              <div style="margin-top:8px; font-size:12px; color:#374151;">Office # 3 In, Al Dirah Dist, P.O.Box 12633, Riyadh - 11461 KSA</div>
              <div style="margin-top:4px; font-size:12px; color:#374151;">Tel: 011-4917295</div>
              <div style="margin-top:4px; font-size:12px; color:#374151;">VAT: 314076518400003</div>
              <div style="margin-top:4px; font-size:12px; color:#374151;">CR: 1010973808</div>
            </div>
          </div>

          <div style="width:420px;">
            <div style="border:1px solid #d1d5db; border-radius:12px; padding:16px; margin-bottom:8px; text-align:right;">
              <div style="font-size:34px; line-height:1.18; color:#1d4ed8; font-weight:800;">شركة الكون الذكي<br/>للاتصالات و تقنيه<br/>المعلومات</div>
              <div style="margin-top:10px; border-top:1px solid #e5e7eb; padding-top:8px; font-size:12px; color:#374151; font-weight:700;">رقم الضريبة المضافة: ٣١٤٠٧٦٥١٨٤٠٠٠٠٣<br/>السجل التجاري: ١٠١٠٩٧٣٨٠٨</div>
            </div>
            <div style="border:1px solid #d1d5db; border-radius:12px; overflow:hidden;">
              <div style="display:flex; align-items:stretch;">
                <div style="width:6px; background:#2563eb;"></div>
                <div style="flex:1; padding:10px 14px; font-size:15px;">
                  <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><strong>Proposal #:</strong><strong style="color:#1d4ed8;">${proposal?.documentControl?.documentNumber || proposal?.id || 'N/A'}</strong></div>
                  <div style="display:flex; justify-content:space-between;"><strong>Date:</strong><strong style="color:#1d4ed8;">${format(safeDate, 'MMM dd, yyyy')}</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style="border-top:1px solid #d1d5db; margin:8px 0 10px 0;"></div>

        <div style="font-size:20px; color:#1d4ed8; font-weight:800; margin-bottom:8px;">Proposal:</div>
        <div style="font-size:15px; color:#1e3a8a; font-weight:700; margin-bottom:4px;">Bill To</div>
        <div style="border:1px solid #d1d5db; background:#f9fafb; border-radius:10px; padding:12px; font-size:12px; line-height:1.45; margin-bottom:10px;">
          <div><strong>Name:</strong> ${customer?.name || 'N/A'}</div>
          <div><strong>Company:</strong> ${customer?.company || 'N/A'}</div>
          <div><strong>Address:</strong> ${customer?.address || 'N/A'}</div>
          <div><strong>Phone:</strong> ${customer?.phone || 'N/A'}</div>
          <div><strong>Email:</strong> ${customer?.email || 'N/A'}</div>
          <div><strong>Valid Until:</strong> ${format(new Date(safeDate.getTime() + 30*24*60*60*1000), 'MMMM dd, yyyy')}</div>
        </div>

        <div style="font-size:20px; color:#1e3a8a; font-weight:800; margin-bottom:6px;">Items & Services</div>
        <table style="width:100%; border-collapse:separate; border-spacing:0; font-size:11.5px; margin-bottom:8px;">
          <thead>
            <tr style="background:linear-gradient(180deg,#2563eb,#1e40af); color:#fff;">
              <th style="padding:8px; font-size:12px; font-weight:700; border:1px solid #9ca3af; width:7%;">S#</th>
              <th style="padding:8px; font-size:12px; font-weight:700; border:1px solid #9ca3af; width:20%;">Item</th>
              <th style="padding:8px; font-size:12px; font-weight:700; border:1px solid #9ca3af; width:31%;">Description</th>
              <th style="padding:8px; font-size:12px; font-weight:700; border:1px solid #9ca3af; width:10%;">Qty</th>
              <th style="padding:8px; font-size:12px; font-weight:700; border:1px solid #9ca3af; width:16%;">Unit Price</th>
              <th style="padding:8px; font-size:12px; font-weight:700; border:1px solid #9ca3af; width:16%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${normalizedItems.map((r: any, idx: number) => `
              <tr>
                <td style="padding:8px; border:1px solid #d1d5db; text-align:center; vertical-align:top;">${r?.serialNumber || idx + 1}</td>
                <td style="padding:8px; border:1px solid #d1d5db; text-align:left; vertical-align:top;">${r?.itemName || r?.item || proposal?.title || 'Service'}</td>
                <td style="padding:8px; border:1px solid #d1d5db; text-align:left; vertical-align:top; line-height:1.35;">${r?.description || ''}</td>
                <td style="padding:8px; border:1px solid #d1d5db; text-align:center; vertical-align:top;">${r?.quantity ?? 0}</td>
                <td style="padding:8px; border:1px solid #d1d5db; text-align:right; vertical-align:top;" class="money">${money(r?.unitPrice)}</td>
                <td style="padding:8px; border:1px solid #d1d5db; text-align:right; vertical-align:top;" class="money">${money(r?.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display:flex; justify-content:flex-end; margin-bottom:10px;">
          <div style="width:360px; border-top:3px solid #1e3a8a; padding-top:6px; font-size:11.5px;">
            <div style="display:flex; justify-content:space-between; margin:4px 0;"><span style="font-weight:700;">Subtotal</span><span style="font-weight:700;" class="money">${money(subtotal)}</span></div>
            <div style="display:flex; justify-content:space-between; margin:4px 0;"><span style="font-weight:700;">Discount (${discountPercent}%)</span><span style="font-weight:700;" class="money">- ${money(discountAmount)}</span></div>
            <div style="display:flex; justify-content:space-between; margin:4px 0; border-bottom:1px dashed #d1d5db; padding-bottom:6px;"><span style="font-weight:700;">VAT (${vatRate}%)</span><span style="font-weight:700;" class="money">${money(vatAmount)}</span></div>
            <div style="display:flex; justify-content:space-between; margin-top:8px;"><span style="font-size:18px; color:#1d4ed8; font-weight:800;">Total</span><span style="font-size:20px; color:#1d4ed8; font-weight:800;" class="money">${money(total)}</span></div>
          </div>
        </div>

        <div style="display:flex; gap:10px; margin-bottom:14px;">
          <div style="flex:1; border:1px solid #d1d5db; border-radius:10px; background:#f9fafb; padding:12px; min-height:120px;">
            <div style="font-size:14px; color:#1e3a8a; font-weight:800; margin-bottom:6px;">Terms & Conditions</div>
            <div style="font-size:11.5px; line-height:1.55; color:#374151;">
              ${(termsList.length ? termsList : ['Payment terms: 30 days from invoice date', 'All prices are in Saudi Riyals (SAR)', 'VAT is included in all prices', 'Delivery timeline as per agreed schedule']).map((t: string) => `<div>${t}</div>`).join('')}
            </div>
          </div>
          <div style="flex:1; border:1px solid #d1d5db; border-radius:10px; background:#f9fafb; padding:12px; min-height:120px;">
            <div style="font-size:14px; color:#1e3a8a; font-weight:800; margin-bottom:6px;">Banking Details</div>
            <div style="font-size:11.5px; line-height:1.7; color:#374151;">
              <div><strong>Bank:</strong> Saudi National Bank</div>
              <div><strong>IBAN:</strong> SA3610000041000000080109</div>
              <div><strong>Account Number:</strong> 41000000080109</div>
            </div>
          </div>
        </div>

        <div style="margin-top:auto; background:linear-gradient(180deg,#111827,#1e3a8a); border-radius:10px; color:#fff; text-align:center; padding:10px 14px; font-size:11.5px; font-weight:600;">
          Smart Universe for Communications and Information Technology<br/>
          Riyadh, Saudi Arabia | Phone: +966 11 4917295 | Email: info@smartuniit.com
        </div>
      </div>
    `;
  }

  private generateProfessionalProposalHTML(proposal: any, customer: any): string {
    const rawProposalDate = proposal?.createdAt || proposal?.created_at || proposal?.date || proposal?.documentControl?.date;
    const parsedProposalDate = rawProposalDate ? new Date(rawProposalDate) : new Date();
    const safeProposalDate = Number.isNaN(parsedProposalDate.getTime()) ? new Date() : parsedProposalDate;
    // Use uploaded logo if available, otherwise use default
    const customerLogoHtml = proposal.customerLogo ? 
      `<img src="${proposal.customerLogo}" alt="Customer Logo" style="max-width: 150px; max-height: 80px; object-fit: contain;" />` :
      `<div style="width: 150px; height: 80px; background: linear-gradient(135deg, #8B4513, #A0522D); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
        <div style="color: white; text-align: center; font-weight: bold; font-size: 14px;">
          <div style="font-size: 18px; margin-bottom: 4px;">${customer?.name || 'Customer'}</div>
          <div style="font-size: 10px;">${customer?.company || 'Company'}</div>
        </div>
      </div>`;

    return `
      <div style="padding: 0; font-family: 'Times New Roman', serif; font-size: 12px; line-height: 1.4; color: #000; background: white;">
        <!-- Page 1: Cover Page -->
        <div style="page-break-after: always; padding: 20mm; position: relative;">
          <!-- Watermark -->
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.1; font-size: 120px; font-weight: bold; color: #f97316; z-index: 1;">
            SMART UNIVERSE
          </div>
          
          <!-- Header with Logos -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; position: relative; z-index: 2;">
            <!-- Left Logo - Customer Logo -->
            <div style="flex: 1; text-align: left;">
              ${customerLogoHtml}
            </div>
            
            <!-- Right Logo - Smart Universe -->
            <div style="flex: 1; text-align: right;">
              <div style="margin-bottom: 10px;">
                <div style="width: 80px; height: 80px; margin-left: auto; margin-bottom: 10px;">
                  <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); border: 2px solid #ff6b35; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden; box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);">
                    <!-- Decorative dots -->
                    <div style="position: absolute; top: 10px; left: 10px; width: 4px; height: 4px; border-radius: 50%; background-color: white; opacity: 0.8;"></div>
                    <div style="position: absolute; top: 10px; right: 10px; width: 4px; height: 4px; border-radius: 50%; background-color: white; opacity: 0.8;"></div>
                    <div style="position: absolute; top: 5px; left: 50%; transform: translateX(-50%); width: 3px; height: 3px; border-radius: 50%; background-color: white; opacity: 0.6;"></div>
                    <div style="position: absolute; bottom: 5px; left: 50%; transform: translateX(-50%); width: 3px; height: 3px; border-radius: 50%; background-color: white; opacity: 0.6;"></div>
                    
                    <!-- Logo text -->
                    <div style="text-align: center; font-size: 10px; line-height: 1.1; font-weight: bold; z-index: 1; font-family: Arial, sans-serif;">
                      <div style="color: #ff6b35; text-shadow: 0 1px 2px rgba(255,255,255,0.8);">SMART</div>
                      <div style="color: #1e40af; text-shadow: 0 1px 2px rgba(255,255,255,0.8);">UNIVERSE</div>
                      <div style="color: #1e40af; font-size: 5px; line-height: 1.2; font-weight: normal; margin-top: 1px;">
                        <div>FOR COMMUNICATIONS</div>
                        <div>AND INFORMATION</div>
                        <div>TECHNOLOGY</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div style="font-size: 24px; font-weight: bold; color: #f97316; margin-bottom: 4px;">SMART UNIVERSE</div>
                <div style="font-size: 10px; color: #666; text-transform: uppercase;">FOR COMMUNICATIONS AND INFORMATION TECHNOLOGY</div>
              </div>
            </div>
          </div>

          <!-- Main Title -->
          <div style="text-align: center; margin: 60px 0; position: relative; z-index: 2;">
            <h1 style="font-size: 36px; font-weight: bold; color: #000; margin: 0 0 20px 0; text-transform: uppercase;">Professional Services</h1>
          </div>

          <!-- Parties Section -->
          <div style="margin: 40px 0; position: relative; z-index: 2;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="font-size: 14px; color: #666; margin-bottom: 8px;">From</div>
              <div style="font-size: 24px; font-weight: bold; color: #f97316; text-decoration: underline wavy red;">Smart UniIT</div>
            </div>
            
            <div style="text-align: center;">
              <div style="font-size: 14px; color: #666; margin-bottom: 8px;">to</div>
              <div style="font-size: 24px; font-weight: bold; color: #000;">${customer?.name || 'Customer Name'}</div>
            </div>
          </div>

          <!-- Submission Details -->
          <div style="position: absolute; bottom: 40px; left: 20mm; right: 20mm; position: relative; z-index: 2;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="font-size: 12px; color: #666;">
                <div style="margin-bottom: 4px;"><strong>Submission Date:</strong> ${format(safeProposalDate, 'MMMM dd, yyyy')}</div>
                <div><strong>Version:</strong> ${proposal.documentControl?.version || 'V 1.0'}</div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="position: absolute; bottom: 20px; left: 20mm; right: 20mm; text-align: center; position: relative; z-index: 2;">
            <div style="font-size: 10px; color: #666; margin-bottom: 8px;">Page 1 of 15</div>
            <div style="font-size: 10px; color: #666;">Copy Right© Smart Universe for Communication & Information Technology</div>
          </div>
        </div>

        <!-- Page 2: Document Control -->
        <div style="page-break-after: always; padding: 20mm; position: relative;">
          <!-- Header with Logo -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
            <div style="flex: 1;">
              <div style="font-size: 24px; font-weight: bold; color: #f97316; margin-bottom: 4px;">SMART UNIVERSE</div>
              <div style="font-size: 10px; color: #666; text-transform: uppercase;">FOR COMMUNICATIONS AND INFORMATION TECHNOLOGY</div>
            </div>
          </div>

          <!-- Section Title -->
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 20px; font-weight: bold; color: #000; margin: 0 0 20px 0; text-transform: uppercase;">DOCUMENT CONTROL</h2>
          </div>

          <!-- Document Control Table -->
          <div style="margin-bottom: 30px;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc;">
              <thead>
                <tr style="background-color: #f9f9f9;">
                  <th style="border: 1px solid #ccc; padding: 12px 8px; text-align: left; font-size: 11px; font-weight: bold;">Document Information</th>
                  <th style="border: 1px solid #ccc; padding: 12px 8px; text-align: left; font-size: 11px; font-weight: bold;">Details</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="border: 1px solid #ccc; padding: 12px 8px; font-size: 11px; font-weight: bold;">Document Title</td>
                  <td style="border: 1px solid #ccc; padding: 12px 8px; font-size: 11px;">${proposal.title || 'Professional Services Proposal'}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="border: 1px solid #ccc; padding: 12px 8px; font-size: 11px; font-weight: bold;">Document Number</td>
                  <td style="border: 1px solid #ccc; padding: 12px 8px; font-size: 11px;">${proposal.id || 'PROP-' + Date.now()}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #ccc; padding: 12px 8px; font-size: 11px; font-weight: bold;">Version</td>
                  <td style="border: 1px solid #ccc; padding: 12px 8px; font-size: 11px;">V 3.0</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="border: 1px solid #ccc; padding: 12px 8px; font-size: 11px; font-weight: bold;">Date</td>
                  <td style="border: 1px solid #ccc; padding: 12px 8px; font-size: 11px;">${format(safeProposalDate, 'dd/MM/yyyy')}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #ccc; padding: 12px 8px; font-size: 11px; font-weight: bold;">Status</td>
                  <td style="border: 1px solid #ccc; padding: 12px 8px; font-size: 11px;">${proposal.status?.toUpperCase() || 'DRAFT'}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="border: 1px solid #ccc; padding: 12px 8px; font-size: 11px; font-weight: bold;">Customer</td>
                  <td style="border: 1px solid #ccc; padding: 12px 8px; font-size: 11px;">${customer?.name || 'Arabian Mills (MC2)'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div style="position: absolute; bottom: 20px; left: 20mm; right: 20mm; text-align: center;">
            <div style="font-size: 10px; color: #666; margin-bottom: 8px;">Page 2 of 15</div>
            <div style="font-size: 10px; color: #666;">Copy Right© Smart Universe for Communication & Information Technology</div>
          </div>
        </div>

        <!-- Page 3: Confidentiality Agreement -->
        <div style="page-break-after: always; padding: 20mm; position: relative;">
          <!-- Header with Logo -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
            <div style="flex: 1;">
              <div style="font-size: 24px; font-weight: bold; color: #f97316; margin-bottom: 4px;">SMART UNIVERSE</div>
              <div style="font-size: 10px; color: #666; text-transform: uppercase;">FOR COMMUNICATIONS AND INFORMATION TECHNOLOGY</div>
            </div>
          </div>

          <!-- Section Title -->
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 20px; font-weight: bold; color: #000; margin: 0 0 20px 0; text-transform: uppercase;">2 CONFIDENTIALITY AGREEMENT</h2>
          </div>

          <!-- Confidentiality Content -->
          <div style="margin-bottom: 30px; line-height: 1.6;">
            <p style="font-size: 12px; margin: 0 0 16px 0; text-align: justify;">
              This document is the property of Smart Uniit and may not be reproduced, by any means, in whole or in part, without prior permission of Smart Uniit. The document is provided on the understanding that its use will be confined to the officers of your Company, and that no part of its contents will be disclosed to third parties without prior written consent of Smart Uniit. The document is to be returned to Smart Uniit when no longer required for the agreed Laying of Fiber Optic Cable and excavation.
            </p>
          </div>

          <!-- Footer -->
          <div style="position: absolute; bottom: 20px; left: 20mm; right: 20mm; text-align: center;">
            <div style="font-size: 10px; color: #666; margin-bottom: 8px;">Page 3 of 15</div>
            <div style="font-size: 10px; color: #666;">Copy Right© Smart Universe for Communication & Information Technology</div>
          </div>
        </div>

        <!-- Page 4: Executive Summary -->
        <div style="page-break-after: always; padding: 20mm; position: relative;">
          <!-- Header with Logo -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
            <div style="flex: 1;">
              <div style="font-size: 24px; font-weight: bold; color: #f97316; margin-bottom: 4px;">SMART UNIVERSE</div>
              <div style="font-size: 10px; color: #666; text-transform: uppercase;">FOR COMMUNICATIONS AND INFORMATION TECHNOLOGY</div>
            </div>
          </div>

          <!-- Section Title -->
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 20px; font-weight: bold; color: #000; margin: 0 0 20px 0; text-transform: uppercase;">3 EXECUTIVE SUMMARY</h2>
          </div>

          <!-- Executive Summary Content -->
          <div style="margin-bottom: 30px; line-height: 1.6;">
            <p style="font-size: 12px; margin: 0 0 16px 0; text-align: justify;">
              Smart Universe Communication & Information Technology is pleased to submit this comprehensive proposal for the provision of professional services to Arabian Mills (MC2). Our proposal outlines a detailed approach to delivering high-quality solutions that meet your specific requirements and objectives.
            </p>
            <p style="font-size: 12px; margin: 0 0 16px 0; text-align: justify;">
              This proposal includes our understanding of your needs, our proposed solution, project timeline, and investment requirements. We are committed to delivering exceptional value and ensuring the success of your project.
            </p>
          </div>

          <!-- Footer -->
          <div style="position: absolute; bottom: 20px; left: 20mm; right: 20mm; text-align: center;">
            <div style="font-size: 10px; color: #666; margin-bottom: 8px;">Page 4 of 15</div>
            <div style="font-size: 10px; color: #666;">Copy Right© Smart Universe for Communication & Information Technology</div>
          </div>
        </div>

        <!-- Page 5: Company Profile -->
        <div style="page-break-after: always; padding: 20mm; position: relative;">
          <!-- Header with Logo -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
            <div style="flex: 1;">
              <div style="font-size: 24px; font-weight: bold; color: #f97316; margin-bottom: 4px;">SMART UNIVERSE</div>
              <div style="font-size: 10px; color: #666; text-transform: uppercase;">FOR COMMUNICATIONS AND INFORMATION TECHNOLOGY</div>
            </div>
          </div>

          <!-- Section Title -->
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 20px; font-weight: bold; color: #000; margin: 0 0 20px 0; text-transform: uppercase;">4 COMPANY PROFILE</h2>
          </div>

          <!-- Company Profile Content -->
          <div style="margin-bottom: 30px; line-height: 1.6;">
            <p style="font-size: 12px; margin: 0 0 16px 0; text-align: justify;">
              Smart Universe Communication & Information Technology is a leading provider of innovative technology solutions, specializing in communications infrastructure and information technology services. With years of experience in the industry, we have successfully delivered numerous projects across various sectors.
            </p>
            <p style="font-size: 12px; margin: 0 0 16px 0; text-align: justify;">
              Our team of certified professionals is dedicated to providing cutting-edge solutions that drive business growth and operational efficiency. We pride ourselves on our commitment to quality, reliability, and customer satisfaction.
            </p>
          </div>

          <!-- Footer -->
          <div style="position: absolute; bottom: 20px; left: 20mm; right: 20mm; text-align: center;">
            <div style="font-size: 10px; color: #666; margin-bottom: 8px;">Page 5 of 15</div>
            <div style="font-size: 10px; color: #666;">Copy Right© Smart Universe for Communication & Information Technology</div>
          </div>
        </div>

        <!-- Additional pages would continue here... -->
        <!-- For brevity, I'm showing the structure for the first 5 pages -->
        <!-- The remaining 10 pages would follow the same pattern with different content sections -->

        <!-- Final Page: Terms and Conditions -->
        <div style="padding: 20mm; position: relative;">
          <!-- Header with Logo -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
            <div style="flex: 1;">
              <div style="font-size: 24px; font-weight: bold; color: #f97316; margin-bottom: 4px;">SMART UNIVERSE</div>
              <div style="font-size: 10px; color: #666; text-transform: uppercase;">FOR COMMUNICATIONS AND INFORMATION TECHNOLOGY</div>
            </div>
          </div>

          <!-- Section Title -->
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 20px; font-weight: bold; color: #000; margin: 0 0 20px 0; text-transform: uppercase;">15 TERMS AND CONDITIONS</h2>
          </div>

          <!-- Terms Content -->
          <div style="margin-bottom: 30px; line-height: 1.6;">
            <p style="font-size: 12px; margin: 0 0 16px 0; text-align: justify;">
              This proposal is valid for 30 days from the date of submission. All prices are subject to change without prior notice after the validity period. Payment terms are net 30 days unless otherwise specified.
            </p>
            <p style="font-size: 12px; margin: 0 0 16px 0; text-align: justify;">
              Smart Universe Communication & Information Technology reserves the right to modify or withdraw this proposal at any time. Acceptance of this proposal constitutes agreement to all terms and conditions outlined herein.
            </p>
          </div>

          <!-- Footer -->
          <div style="position: absolute; bottom: 20px; left: 20mm; right: 20mm; text-align: center;">
            <div style="font-size: 10px; color: #666; margin-bottom: 8px;">Page 15 of 15</div>
            <div style="font-size: 10px; color: #666;">Copy Right© Smart Universe for Communication & Information Technology</div>
          </div>
        </div>
      </div>
    `;
  }

  // Invoice PDF Export
  public async exportInvoicePDF(invoice: any, customer: any, lineItems: any[] = []): Promise<void> {
    const htmlContent = this.generateInvoiceHTML(invoice, customer, lineItems);
    const filename = `Invoice_${invoice.invoiceNumber}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    await this.generatePDFFromHTML(htmlContent, filename);
  }

  private generateInvoiceHTML(invoice: any, customer: any, lineItems: any[]): string {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const vatAmount = subtotal * 0.15; // 15% VAT
    const total = subtotal + vatAmount;

    return `
      <div style="padding: 20mm; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #000;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #f97316; padding-bottom: 20px;">
          <div style="flex: 1;">
            <div style="width: 120px; height: 60px; margin-bottom: 15px;">
              <div style="width: 120px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); border: 2px solid #ff6b35; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden; box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);">
                <!-- Decorative dots -->
                <div style="position: absolute; top: 8px; left: 8px; width: 3px; height: 3px; border-radius: 50%; background-color: white; opacity: 0.8;"></div>
                <div style="position: absolute; top: 8px; right: 8px; width: 3px; height: 3px; border-radius: 50%; background-color: white; opacity: 0.8;"></div>
                <div style="position: absolute; top: 4px; left: 50%; transform: translateX(-50%); width: 2px; height: 2px; border-radius: 50%; background-color: white; opacity: 0.6;"></div>
                <div style="position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); width: 2px; height: 2px; border-radius: 50%; background-color: white; opacity: 0.6;"></div>
                
                <!-- Logo text -->
                <div style="text-align: center; font-size: 8px; line-height: 1.1; font-weight: bold; z-index: 1; font-family: Arial, sans-serif;">
                  <div style="color: #ff6b35; text-shadow: 0 1px 2px rgba(255,255,255,0.8);">SMART</div>
                  <div style="color: #1e40af; text-shadow: 0 1px 2px rgba(255,255,255,0.8);">UNIVERSE</div>
                  <div style="color: #1e40af; font-size: 4px; line-height: 1.2; font-weight: normal; margin-top: 1px;">
                    <div>FOR COMMUNICATIONS</div>
                    <div>AND INFORMATION</div>
                    <div>TECHNOLOGY</div>
                  </div>
                </div>
              </div>
            </div>
            <div style="font-size: 11px; color: #666;">
              <p style="font-weight: bold; font-size: 16px; color: #000; margin: 0 0 8px 0;">
                Smart Universe Communication & IT
              </p>
              <p style="margin: 0 0 4px 0;">King Fahd Road, Riyadh 12345, Saudi Arabia</p>
              <p style="margin: 0 0 4px 0;">Phone Number: +966 550188288</p>
              <p style="margin: 0 0 4px 0;">Email: info@smartuniit.com</p>
              <p style="margin: 0 0 4px 0;">VAT: 300987654321003</p>
            </div>
          </div>
          <div style="text-align: right;">
            <h1 style="font-size: 28px; font-weight: bold; color: #f97316; margin: 0 0 8px 0;">INVOICE</h1>
            <div style="font-size: 11px; color: #666;">
              <p style="margin: 0 0 4px 0;"><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
              <p style="margin: 0 0 4px 0;"><strong>Date:</strong> ${format(invoice.createdAt, 'dd/MM/yyyy')}</p>
              <p style="margin: 0 0 4px 0;"><strong>Due Date:</strong> ${format(invoice.dueDate, 'dd/MM/yyyy')}</p>
              <p style="margin: 0;"><strong>Status:</strong> ${invoice.status.toUpperCase()}</p>
            </div>
          </div>
        </div>

        <!-- Customer Details -->
        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 16px; font-weight: bold; color: #000; margin: 0 0 12px 0; border-bottom: 1px solid #ccc; padding-bottom: 8px;">
            Bill To
          </h3>
          <div style="font-size: 11px; color: #666;">
            <p style="font-weight: bold; color: #000; margin: 0 0 4px 0;">${customer?.name || 'Customer Name'}</p>
            <p style="margin: 0 0 4px 0;">${customer?.email || 'customer@email.com'}</p>
            <p style="margin: 0 0 4px 0;">${customer?.phone || 'Phone Number'}</p>
            ${customer?.address ? `<p style="margin: 0 0 4px 0;">${customer.address}</p>` : ''}
          </div>
        </div>

        <!-- Line Items -->
        ${lineItems.length > 0 ? `
          <div style="margin-bottom: 30px;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc;">
              <thead>
                <tr style="background-color: #fef3e2;">
                  <th style="border: 1px solid #ccc; padding: 12px 8px; text-align: left; font-size: 11px; font-weight: bold;">
                    Description
                  </th>
                  <th style="border: 1px solid #ccc; padding: 12px 8px; text-align: center; font-size: 11px; font-weight: bold;">
                    Qty
                  </th>
                  <th style="border: 1px solid #ccc; padding: 12px 8px; text-align: right; font-size: 11px; font-weight: bold;">
                    Unit Price ($)
                  </th>
                  <th style="border: 1px solid #ccc; padding: 12px 8px; text-align: right; font-size: 11px; font-weight: bold;">
                    Total ($)
                  </th>
                </tr>
              </thead>
              <tbody>
                ${lineItems.map((item, index) => `
                  <tr style="background-color: ${index % 2 === 0 ? '#f9f9f9' : '#fff'};">
                    <td style="border: 1px solid #ccc; padding: 12px 8px; font-size: 10px;">
                      ${item.description}
                    </td>
                    <td style="border: 1px solid #ccc; padding: 12px 8px; text-align: center; font-size: 10px;">
                      ${item.quantity}
                    </td>
                    <td style="border: 1px solid #ccc; padding: 12px 8px; text-align: right; font-size: 10px;">
                      ${item.unitPrice.toLocaleString()}
                    </td>
                    <td style="border: 1px solid #ccc; padding: 12px 8px; text-align: right; font-size: 10px; font-weight: bold;">
                      ${item.total.toLocaleString()}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Totals -->
          <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
            <div style="width: 300px;">
              <div style="background-color: #f9f9f9; padding: 16px; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-size: 11px; color: #666;">Subtotal:</span>
                  <span style="font-size: 11px; font-weight: bold;">$${subtotal.toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-size: 11px; color: #666;">VAT (15%):</span>
                  <span style="font-size: 11px; font-weight: bold;">$${vatAmount.toLocaleString()}</span>
                </div>
                <div style="border-top: 1px solid #ccc; padding-top: 8px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span style="font-size: 14px; font-weight: bold; color: #000;">Total:</span>
                    <span style="font-size: 14px; font-weight: bold; color: #f97316;">$${total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ` : `
          <div style="margin-bottom: 30px; text-align: center; padding: 40px; background-color: #f9f9f9; border-radius: 8px;">
            <p style="font-size: 18px; font-weight: bold; color: #f97316; margin: 0 0 8px 0;">$${invoice.amount.toLocaleString()}</p>
            <p style="font-size: 12px; color: #666; margin: 0;">Total Amount</p>
          </div>
        `}

        <!-- Payment Terms -->
        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 16px; font-weight: bold; color: #000; margin: 0 0 12px 0;">Payment Terms</h3>
          <p style="font-size: 11px; color: #666; margin: 0;">
            Payment is due within 30 days of invoice date. Late payments may incur additional charges.
          </p>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #ccc; padding-top: 20px; margin-top: 30px; text-align: center;">
          <p style="font-size: 10px; color: #666; margin: 0;">
            Thank you for your business!
          </p>
        </div>
      </div>
    `;
  }

  // Budget PDF Export
  public async exportBudgetPDF(budget: any, project: any, categories: any[] = []): Promise<void> {
    const htmlContent = this.generateBudgetHTML(budget, project, categories);
    const filename = `Budget_${project?.title?.replace(/\s+/g, '_') || 'Budget'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    await this.generatePDFFromHTML(htmlContent, filename);
  }

  private generateBudgetHTML(budget: any, project: any, categories: any[]): string {
    const totalSpent = categories.reduce((sum, cat) => sum + (cat.spentAmount || 0), 0);
    const utilizationRate = budget.amount > 0 ? (totalSpent / budget.amount) * 100 : 0;

    return `
      <div style="padding: 20mm; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #000;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #f97316; padding-bottom: 20px;">
          <div style="flex: 1;">
            <div style="width: 120px; height: 60px; margin-bottom: 15px;">
              <div style="width: 120px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); border: 2px solid #ff6b35; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden; box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);">
                <!-- Decorative dots -->
                <div style="position: absolute; top: 8px; left: 8px; width: 3px; height: 3px; border-radius: 50%; background-color: white; opacity: 0.8;"></div>
                <div style="position: absolute; top: 8px; right: 8px; width: 3px; height: 3px; border-radius: 50%; background-color: white; opacity: 0.8;"></div>
                <div style="position: absolute; top: 4px; left: 50%; transform: translateX(-50%); width: 2px; height: 2px; border-radius: 50%; background-color: white; opacity: 0.6;"></div>
                <div style="position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); width: 2px; height: 2px; border-radius: 50%; background-color: white; opacity: 0.6;"></div>
                
                <!-- Logo text -->
                <div style="text-align: center; font-size: 8px; line-height: 1.1; font-weight: bold; z-index: 1; font-family: Arial, sans-serif;">
                  <div style="color: #ff6b35; text-shadow: 0 1px 2px rgba(255,255,255,0.8);">SMART</div>
                  <div style="color: #1e40af; text-shadow: 0 1px 2px rgba(255,255,255,0.8);">UNIVERSE</div>
                  <div style="color: #1e40af; font-size: 4px; line-height: 1.2; font-weight: normal; margin-top: 1px;">
                    <div>FOR COMMUNICATIONS</div>
                    <div>AND INFORMATION</div>
                    <div>TECHNOLOGY</div>
                  </div>
                </div>
              </div>
            </div>
            <div style="font-size: 11px; color: #666;">
              <p style="font-weight: bold; font-size: 16px; color: #000; margin: 0 0 8px 0;">
                Smart Universe Communication & IT
              </p>
              <p style="margin: 0 0 4px 0;">King Fahd Road, Riyadh 12345, Saudi Arabia</p>
              <p style="margin: 0 0 4px 0;">Phone Number: +966 550188288</p>
              <p style="margin: 0 0 4px 0;">Email: info@smartuniit.com</p>
            </div>
          </div>
          <div style="text-align: right;">
            <h1 style="font-size: 28px; font-weight: bold; color: #f97316; margin: 0 0 8px 0;">BUDGET REPORT</h1>
            <div style="font-size: 11px; color: #666;">
              <p style="margin: 0 0 4px 0;"><strong>Budget ID:</strong> ${budget.id}</p>
              <p style="margin: 0 0 4px 0;"><strong>Date:</strong> ${format(budget.createdAt, 'dd/MM/yyyy')}</p>
              <p style="margin: 0;"><strong>Status:</strong> ${budget.status.toUpperCase()}</p>
            </div>
          </div>
        </div>

        <!-- Project Details -->
        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 16px; font-weight: bold; color: #000; margin: 0 0 12px 0; border-bottom: 1px solid #ccc; padding-bottom: 8px;">
            Project Information
          </h3>
          <div style="font-size: 11px; color: #666;">
            <p style="font-weight: bold; color: #000; margin: 0 0 4px 0;">${project?.title || 'Project Name'}</p>
            <p style="margin: 0 0 4px 0;">${project?.description || 'Project Description'}</p>
          </div>
        </div>

        <!-- Budget Summary -->
        <div style="margin-bottom: 30px; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h3 style="font-size: 16px; font-weight: bold; color: #000; margin: 0 0 16px 0;">Budget Summary</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
            <div style="text-align: center;">
              <p style="font-size: 18px; font-weight: bold; color: #f97316; margin: 0 0 4px 0;">$${budget.amount.toLocaleString()}</p>
              <p style="font-size: 11px; color: #666; margin: 0;">Total Budget</p>
            </div>
            <div style="text-align: center;">
              <p style="font-size: 18px; font-weight: bold; color: #dc2626; margin: 0 0 4px 0;">$${totalSpent.toLocaleString()}</p>
              <p style="font-size: 11px; color: #666; margin: 0;">Total Spent</p>
            </div>
            <div style="text-align: center;">
              <p style="font-size: 18px; font-weight: bold; color: ${utilizationRate > 90 ? '#dc2626' : '#16a34a'}; margin: 0 0 4px 0;">${utilizationRate.toFixed(1)}%</p>
              <p style="font-size: 11px; color: #666; margin: 0;">Utilization</p>
            </div>
          </div>
        </div>

        <!-- Budget Categories -->
        ${categories.length > 0 ? `
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 16px; font-weight: bold; color: #000; margin: 0 0 16px 0;">Budget Categories</h3>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc;">
              <thead>
                <tr style="background-color: #fef3e2;">
                  <th style="border: 1px solid #ccc; padding: 12px 8px; text-align: left; font-size: 11px; font-weight: bold;">
                    Category
                  </th>
                  <th style="border: 1px solid #ccc; padding: 12px 8px; text-align: right; font-size: 11px; font-weight: bold;">
                    Allocated ($)
                  </th>
                  <th style="border: 1px solid #ccc; padding: 12px 8px; text-align: right; font-size: 11px; font-weight: bold;">
                    Spent ($)
                  </th>
                  <th style="border: 1px solid #ccc; padding: 12px 8px; text-align: right; font-size: 11px; font-weight: bold;">
                    Remaining ($)
                  </th>
                  <th style="border: 1px solid #ccc; padding: 12px 8px; text-align: center; font-size: 11px; font-weight: bold;">
                    Utilization (%)
                  </th>
                </tr>
              </thead>
              <tbody>
                ${categories.map((category, index) => {
                  const remaining = category.allocatedAmount - (category.spentAmount || 0);
                  const categoryUtilization = category.allocatedAmount > 0 ? ((category.spentAmount || 0) / category.allocatedAmount) * 100 : 0;
                  return `
                    <tr style="background-color: ${index % 2 === 0 ? '#f9f9f9' : '#fff'};">
                      <td style="border: 1px solid #ccc; padding: 12px 8px; font-size: 10px;">
                        <div>
                          <p style="font-weight: bold; margin: 0 0 4px 0;">${category.name}</p>
                          ${category.description ? `<p style="color: #666; font-size: 9px; margin: 0;">${category.description}</p>` : ''}
                        </div>
                      </td>
                      <td style="border: 1px solid #ccc; padding: 12px 8px; text-align: right; font-size: 10px;">
                        ${category.allocatedAmount.toLocaleString()}
                      </td>
                      <td style="border: 1px solid #ccc; padding: 12px 8px; text-align: right; font-size: 10px;">
                        ${(category.spentAmount || 0).toLocaleString()}
                      </td>
                      <td style="border: 1px solid #ccc; padding: 12px 8px; text-align: right; font-size: 10px; color: ${remaining < 0 ? '#dc2626' : '#16a34a'};">
                        ${remaining.toLocaleString()}
                      </td>
                      <td style="border: 1px solid #ccc; padding: 12px 8px; text-align: center; font-size: 10px; color: ${categoryUtilization > 90 ? '#dc2626' : '#16a34a'};">
                        ${categoryUtilization.toFixed(1)}%
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="border-top: 1px solid #ccc; padding-top: 20px; margin-top: 30px; text-align: center;">
          <p style="font-size: 10px; color: #666; margin: 0;">
            Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}
          </p>
        </div>
      </div>
    `;
  }
}

export const pdfExports = PDFExportUtils.getInstance();