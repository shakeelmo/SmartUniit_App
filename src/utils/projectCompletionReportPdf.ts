import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { SMART_UNIVERSE_LOGO_BASE64 } from './logoBase64';
import { ProjectCompletionReport } from '../types/projectCompletionReport';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;
const TOP = 26;
const BOTTOM = PAGE_H - 20;

const COMPANY = {
  displayName: 'Smart Universe',
  legalName: 'Smart Universe Communication and Information Technology',
  address: 'Office # 3 ln, Al Dirah Dist, P.O.Box 12633, Riyadh - 11461 KSA',
  phone: '011-4917295',
  email: 'info@smartuniit.com',
};

const PRIMARY = [30, 64, 175] as const;
const DARK = [23, 37, 84] as const;
const BODY = [51, 65, 85] as const;
const MUTED = [100, 116, 139] as const;
const LINE = [203, 213, 225] as const;

interface Ctx {
  pdf: jsPDF;
  page: number;
  y: number;
}

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

const getImageDimensions = (dataUrl: string): Promise<{ w: number; h: number }> =>
  new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve({ w: 4, h: 3 });
      return;
    }
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 4, h: img.naturalHeight || 3 });
    img.onerror = () => resolve({ w: 4, h: 3 });
    img.src = dataUrl;
  });

function drawChrome(ctx: Ctx) {
  const { pdf } = ctx;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  pdf.text('SmartUniit - Project Completion Report', MARGIN, 11);
  pdf.setDrawColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  pdf.setLineWidth(0.6);
  pdf.line(MARGIN, 14, PAGE_W - MARGIN, 14);
  ctx.y = TOP;
}

const drawFooter = (pdf: jsPDF, pageNumber: number, totalPages: number) => {
  pdf.setDrawColor(220, 226, 237);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(107, 114, 128);
  pdf.text(
    `${COMPANY.legalName} | Tel: ${COMPANY.phone} | ${COMPANY.email}`,
    PAGE_W / 2,
    PAGE_H - 8,
    { align: 'center' }
  );
  pdf.text(`Page ${pageNumber} of ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' });
};

function ensure(ctx: Ctx, needed: number) {
  if (ctx.y + needed > BOTTOM) {
    ctx.pdf.addPage();
    ctx.page += 1;
    drawChrome(ctx);
  }
}

function sectionTitle(ctx: Ctx, title: string) {
  ensure(ctx, 16);
  const { pdf, y } = ctx;
  pdf.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  pdf.rect(MARGIN, y - 5, 3.2, 7, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(DARK[0], DARK[1], DARK[2]);
  pdf.text(title, MARGIN + 6, y);
  ctx.y = y + 8;
}

function paragraph(ctx: Ctx, text: string, opts: { size?: number; color?: readonly number[]; italic?: boolean } = {}) {
  const clean = cleanText(text);
  if (!clean) return;
  const { pdf } = ctx;
  const size = opts.size || 10;
  const lineH = size * 0.56;
  pdf.setFont('helvetica', opts.italic ? 'italic' : 'normal');
  pdf.setFontSize(size);
  pdf.setTextColor(...(opts.color || BODY));
  const lines = pdf.splitTextToSize(clean, CONTENT_W);
  for (const line of lines) {
    ensure(ctx, lineH);
    pdf.text(line, MARGIN, ctx.y);
    ctx.y += lineH;
  }
  ctx.y += 2.5;
}

function bulletList(ctx: Ctx, items: string[]) {
  const { pdf } = ctx;
  const lineH = 5.2;
  for (const raw of items) {
    const item = cleanText(raw);
    if (!item) continue;
    const lines = pdf.splitTextToSize(item, CONTENT_W - 7);
    ensure(ctx, lineH * lines.length + 1);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(...BODY);
    pdf.text('•', MARGIN, ctx.y);
    pdf.text(lines[0], MARGIN + 4.5, ctx.y);
    ctx.y += lineH;
    for (let i = 1; i < lines.length; i++) {
      pdf.text(lines[i], MARGIN + 4.5, ctx.y);
      ctx.y += lineH;
    }
    ctx.y += 0.8;
  }
  ctx.y += 2;
}

function detailRow(ctx: Ctx, label: string, value: string, width = CONTENT_W) {
  const { pdf } = ctx;
  const labelW = 46;
  const valueW = width - labelW;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(...MUTED);
  pdf.text(label, MARGIN, ctx.y);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(...DARK);
  const valueLines = pdf.splitTextToSize(cleanText(value) || '-', valueW);
  ensure(ctx, 5.4 * valueLines.length);
  pdf.text(valueLines[0], MARGIN + labelW, ctx.y);
  ctx.y += 5.4;
  for (let i = 1; i < valueLines.length; i++) {
    ensure(ctx, 5.4);
    pdf.text(valueLines[i], MARGIN + labelW, ctx.y);
    ctx.y += 5.4;
  }
}

function detailsTable(ctx: Ctx, rows: [string, string][]) {
  const { pdf } = ctx;
  const rowH = 7.2;
  const labelW = 52;
  ensure(ctx, rows.length * rowH + 2);
  pdf.setDrawColor(...LINE);
  pdf.setLineWidth(0.3);
  rows.forEach(([label, value], index) => {
    const y = ctx.y + index * rowH;
    pdf.rect(MARGIN, y, CONTENT_W, rowH);
    pdf.setFillColor(index % 2 === 0 ? 248 : 255, index % 2 === 0 ? 250 : 255, index % 2 === 0 ? 255 : 255);
    pdf.rect(MARGIN, y, CONTENT_W, rowH, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(...MUTED);
    pdf.text(label, MARGIN + 4, y + 4.8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...DARK);
    const valueLines = pdf.splitTextToSize(cleanText(value) || '-', CONTENT_W - labelW - 8);
    pdf.text(valueLines[0], MARGIN + labelW, y + 4.8);
    for (let i = 1; i < valueLines.length; i++) {
      ensure(ctx, rowH);
      pdf.text(valueLines[i], MARGIN + labelW, y + 4.8 + i * 5);
    }
  });
  ctx.y += rows.length * rowH + 4;
}

function addLogo(pdf: jsPDF, dataUrl: string | null | undefined, x: number, y: number, w: number, h: number) {
  if (!dataUrl) return;
  try {
    const format = dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg') ? 'JPEG' : 'PNG';
    pdf.addImage(dataUrl, format, x, y, w, h);
  } catch {
    // Logo is optional; skip if it cannot be embedded
  }
}

export async function generateProjectCompletionReportPdf(report: ProjectCompletionReport) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const ctx: Ctx = { pdf, page: 1, y: TOP };

  // Normalize camelCase (frontend) and snake_case (raw API) field names
  const raw = report as any;
  const title = raw.title || '';
  const subtitle = raw.subtitle || '';
  const clientName = raw.clientName || raw.client_name || '';
  const clientCompany = raw.clientCompany || raw.client_company || '';
  const clientFormerName = raw.clientFormerName || raw.client_former_name || '';
  const clientLogo = raw.clientLogo || raw.client_logo || null;
  const contractorName = raw.contractorName || raw.contractor_name || COMPANY.legalName;
  const reportNumber = raw.reportNumber || raw.report_number || '';
  const submissionDate = raw.submissionDate || raw.submission_date || '';
  const completionDate = raw.completionDate || raw.completion_date || '';
  const version = raw.version || '';
  const projectLocation = raw.projectLocation || raw.project_location || '';
  const projectManager = raw.projectManager || raw.project_manager || '';
  const scopeOfWork = raw.scopeOfWork || raw.scope_of_work || '';
  const introduction = raw.introduction || '';
  const scopeContent = raw.scopeContent || raw.scope_content || '';
  const executionDetails = raw.executionDetails || {};
  const testingDetails = raw.testingDetails || raw.testing_details || '';
  const conclusion = raw.conclusion || '';
  const photos = raw.photos || [];
  const signatures = raw.signatures || [];

  // ================= PAGE 1: TITLE =================
  addLogo(pdf, SMART_UNIVERSE_LOGO_BASE64, MARGIN, 24, 56, 22);
  if (clientLogo) {
    addLogo(pdf, clientLogo, PAGE_W - MARGIN - 56, 24, 56, 22);
  }

  pdf.setDrawColor(...LINE);
  pdf.setLineWidth(0.4);
  pdf.line(MARGIN, 54, PAGE_W - MARGIN, 54);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...PRIMARY);
  pdf.text('SMART UNIVERSE COMMUNICATION AND INFORMATION TECHNOLOGY', PAGE_W / 2, 70, { align: 'center' });

  pdf.setFontSize(24);
  pdf.setTextColor(...DARK);
  pdf.text('PROJECT COMPLETION REPORT', PAGE_W / 2, 84, { align: 'center' });

  pdf.setDrawColor(...PRIMARY);
  pdf.setLineWidth(0.8);
  pdf.line(PAGE_W / 2 - 45, 89, PAGE_W / 2 + 45, 89);

  pdf.setFontSize(16);
  pdf.setTextColor(20, 30, 60);
  pdf.text(cleanText(title) || 'Project Completion Report', PAGE_W / 2, 102, { align: 'center' });

  if (subtitle) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(...BODY);
    const subLines = pdf.splitTextToSize(cleanText(subtitle), CONTENT_W - 40);
    let subY = 112;
    for (const line of subLines) {
      pdf.text(line, PAGE_W / 2, subY, { align: 'center' });
      subY += 5.5;
    }
  }

  pdf.setFontSize(10);
  pdf.setTextColor(...MUTED);
  pdf.text(`Report No: ${reportNumber}`, PAGE_W / 2, 140, { align: 'center' });

  const titleRows: [string, string][] = [
    ['Client Company', clientCompany],
    ['Client Name', clientName],
    ['Formerly Known As', clientFormerName],
    ['Client Representative', raw.clientRepName || raw.client_rep_name || ''],
    ['Representative Designation', raw.clientRepDesignation || raw.client_rep_designation || ''],
    ['Representative Phone', raw.clientRepPhone || raw.client_rep_phone || ''],
    ['Representative Email', raw.clientRepEmail || raw.client_rep_email || ''],
    ['Contractor', contractorName],
    ['Project Location', projectLocation],
    ['Project Manager', projectManager],
    ['Date of Completion', formatDate(completionDate)],
    ['Submission Date', formatDate(submissionDate)],
    ['Version', version],
  ];
  ctx.y = 152;
  detailsTable(ctx, titleRows);

  // ================= PAGE 2: DOC INFO + TOC =================
  pdf.addPage();
  ctx.page = 2;
  drawChrome(ctx);
  sectionTitle(ctx, 'Document Information');
  detailsTable(ctx, [
    ['Submission Date', formatDate(submissionDate)],
    ['Version', version],
    ['Client', clientName],
    ['Contractor', contractorName],
    ['Report No', reportNumber],
  ]);
  sectionTitle(ctx, 'Contractor Details');
  detailsTable(ctx, [
    ['Company', COMPANY.legalName],
    ['Address', COMPANY.address],
    ['Phone', COMPANY.phone],
    ['Email', COMPANY.email],
  ]);

  sectionTitle(ctx, 'Table of Contents');
  const toc = [
    '1. Introduction',
    '2. Project Overview',
    '3. Project Scope',
    '4. Execution Details',
    '5. Testing and Verification',
    '6. Project Photos',
    '7. Conclusion',
    '8. Sign-off',
  ];
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10.5);
  pdf.setTextColor(...BODY);
  for (const item of toc) {
    pdf.setFont('helvetica', 'normal');
    pdf.text(item, MARGIN + 2, ctx.y);
    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.2);
    pdf.line(MARGIN + 2, ctx.y + 1.2, PAGE_W - MARGIN - 20, ctx.y + 1.2);
    ctx.y += 8;
  }

  // ================= 1. INTRODUCTION =================
  pdf.addPage();
  ctx.page = 3;
  drawChrome(ctx);
  sectionTitle(ctx, '1. Introduction');
  paragraph(ctx, introduction);

  // ================= 2. PROJECT OVERVIEW =================
  sectionTitle(ctx, '2. Project Overview');
  detailsTable(ctx, [
    ['Project Name', title],
    ['Client', clientName],
    ['Client Company', clientCompany],
    ['Date of Completion', formatDate(completionDate)],
    ['Project Location', projectLocation],
    ['Contractor', contractorName],
    ['Project Manager', projectManager],
  ]);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...DARK);
  pdf.text('Scope of Work', MARGIN, ctx.y);
  ctx.y += 5.5;
  paragraph(ctx, scopeOfWork);

  // ================= 3. PROJECT SCOPE =================
  sectionTitle(ctx, '3. Project Scope');
  paragraph(ctx, scopeContent);

  // ================= 4. EXECUTION DETAILS =================
  sectionTitle(ctx, '4. Execution Details');
  const executionSections: { key: string; label: string }[] = [
    { key: 'civilWork', label: 'a. Civil Work' },
    { key: 'cableConduit', label: 'b. Cable & Conduit Installation' },
    { key: 'networkHardware', label: 'c. Network Hardware' },
    { key: 'layingPulling', label: 'd. Laying & Pulling Activities' },
    { key: 'splicingTermination', label: 'e. Splicing & Termination' },
  ];
  for (const section of executionSections) {
    const items: string[] = executionDetails?.[section.key] || [];
    ensure(ctx, 10);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.5);
    pdf.setTextColor(...DARK);
    pdf.text(section.label, MARGIN, ctx.y);
    ctx.y += 5.5;
    if (items.length) {
      bulletList(ctx, items);
    } else {
      ctx.y += 1;
    }
  }

  // ================= 5. TESTING AND VERIFICATION =================
  sectionTitle(ctx, '5. Testing and Verification');
  paragraph(ctx, testingDetails);

  // ================= 6. PROJECT PHOTOS =================
  sectionTitle(ctx, '6. Project Photos');
  if (photos.length) {
    ctx.y += 3;
    const cols = 3;
    const gap = 5;
    const colW = (CONTENT_W - gap * (cols - 1)) / cols;
    const mat = 2.5;
    const shadow = 1.3;
    const minH = 34;
    const maxH = 82;
    const colY = [ctx.y, ctx.y, ctx.y];
    const colX = Array.from({ length: cols }, (_, c) => MARGIN + c * (colW + gap));

    for (const photo of photos) {
      if (!photo.dataUrl) continue;
      const format = photo.dataUrl.includes('image/jpeg') || photo.dataUrl.includes('image/jpg') ? 'JPEG' : 'PNG';
      const dims = await getImageDimensions(photo.dataUrl);
      const aspect = dims.w / dims.h || 4 / 3;
      let h = colW / aspect;
      h = Math.min(Math.max(h, minH), maxH);

      // Place into the shortest column (masonry style)
      let col = 0;
      for (let c = 1; c < cols; c++) {
        if (colY[c] < colY[col]) col = c;
      }
      if (colY[col] + h + mat * 2 + 10 > BOTTOM) {
        pdf.addPage();
        ctx.page += 1;
        drawChrome(ctx);
        for (let c = 0; c < cols; c++) colY[c] = ctx.y;
        col = 0;
      }

      const x = colX[col];
      const y = colY[col];

      try {
        // Soft shadow behind the mat
        pdf.setFillColor(214, 219, 228);
        pdf.roundedRect(x + shadow, y + shadow, colW + mat * 2, h + mat * 2, 2, 2, 'F');
        // White mat frame
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(x, y, colW + mat * 2, h + mat * 2, 2, 2, 'FD');
        // Photo inside the mat
        pdf.addImage(photo.dataUrl, format, x + mat, y + mat, colW, h);
      } catch {
        // Skip photos that cannot be embedded
      }

      colY[col] = y + h + mat * 2 + 8;
    }
    ctx.y = Math.max(colY[0], colY[1], colY[2]) + 2;
  } else {
    paragraph(ctx, 'No project photos uploaded.', { italic: true, color: MUTED });
  }

  // ================= 7. CONCLUSION =================
  sectionTitle(ctx, '7. Conclusion');
  paragraph(ctx, conclusion);

  // ================= 8. SIGN-OFF =================
  sectionTitle(ctx, '8. Sign-off');
  paragraph(
    ctx,
    'We, SmartUniit, confirm that the project has been completed as per the agreed-upon specifications. Please find the details of the project completion, testing reports, and documentation attached for your approval.'
  );

  const effectiveSignatures =
    signatures.length > 0
      ? signatures
      : [
          { label: 'Client Representative 1', name: '', designation: '', signature: '', date: '' },
          { label: 'Client Representative 2', name: '', designation: '', signature: '', date: '' },
          { label: 'SmartUniit Representative', name: '', designation: '', signature: '', date: '' },
        ];

  for (const sig of effectiveSignatures) {
    const blockH = sig.signature ? 40 : 34;
    ensure(ctx, blockH + 4);
    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.3);
    pdf.rect(MARGIN, ctx.y, CONTENT_W, blockH);
    pdf.setFillColor(250, 251, 255);
    pdf.rect(MARGIN, ctx.y, CONTENT_W, blockH, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(...DARK);
    pdf.text(sig.label || 'Representative', MARGIN + 5, ctx.y + 6);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(...BODY);
    pdf.text(`Name: ${cleanText(sig.name) || '____________________'}`, MARGIN + 5, ctx.y + 13);
    if (sig.designation) {
      pdf.text(`Designation: ${cleanText(sig.designation)}`, MARGIN + 5, ctx.y + 19);
    }
    pdf.text(`Date: ${formatDate(sig.date)}`, MARGIN + 5, ctx.y + (sig.designation ? 25 : 19));

    if (sig.signature) {
      addLogo(pdf, sig.signature, MARGIN + 85, ctx.y + 8, 60, 18);
    }
    pdf.setDrawColor(...DARK);
    pdf.setLineWidth(0.35);
    pdf.line(MARGIN + 85, ctx.y + blockH - 7, MARGIN + CONTENT_W - 8, ctx.y + blockH - 7);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8);
    pdf.setTextColor(...MUTED);
    pdf.text('Signature', MARGIN + 85, ctx.y + blockH - 3.5);

    ctx.y += blockH + 5;
  }

  // ================= FOOTER (all pages) =================
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    drawFooter(pdf, i, totalPages);
  }

  return pdf;
}
