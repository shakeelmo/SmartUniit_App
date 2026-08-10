import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { SMART_UNIVERSE_LOGO_BASE64 } from './logoBase64';
import { ProjectCompletionReport } from '../types/projectCompletionReport';

const COMPANY = {
  displayName: 'Smart Universe',
  legalName: 'Smart Universe Communication and Information Technology',
  address: 'Office # 3 ln, Al Dirah Dist, P.O.Box 12633, Riyadh - 11461 KSA',
  phone: '011-4917295',
  email: 'info@smartuniit.com',
};

const PAGE_WIDTH = 210; // A4 mm
const PAGE_HEIGHT = 297;
const MARGIN = 16;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const formatDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, 'dd/MM/yyyy');
};

const cleanText = (value: any): string => {
  if (!value) return '';
  return String(value).replace(/\r\n/g, '\n').trim();
};

function addPageChrome(pdf: jsPDF, pageNumber: number, totalPages: number) {
  // Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(20, 40, 80);
  pdf.text('SmartUniit - Project Completion Report', MARGIN, 10);
  pdf.setDrawColor(30, 64, 175);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN, 12.5, PAGE_WIDTH - MARGIN, 12.5);

  // Footer
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text(
    `Page ${pageNumber} (${totalPages})`,
    PAGE_WIDTH - MARGIN,
    PAGE_HEIGHT - 8,
    { align: 'right' }
  );
  pdf.text('Smart Universe Communication and Information Technology', MARGIN, PAGE_HEIGHT - 8);
}

function addSectionTitle(pdf: jsPDF, title: string, y: number): number {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(30, 64, 175);
  pdf.text(title, MARGIN, y);
  pdf.setDrawColor(30, 64, 175);
  pdf.setLineWidth(0.4);
  pdf.line(MARGIN, y + 1.5, MARGIN + 45, y + 1.5);
  return y + 7;
}

function addParagraph(pdf: jsPDF, text: string, y: number, maxWidth = CONTENT_WIDTH): number {
  if (!text) return y;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(40, 40, 40);
  const lines = pdf.splitTextToSize(text, maxWidth);
  for (const line of lines) {
    if (y > PAGE_HEIGHT - 20) {
      return y;
    }
    pdf.text(line, MARGIN, y);
    y += 5;
  }
  return y + 2;
}

function addBulletList(pdf: jsPDF, items: string[], y: number): number {
  for (const item of items) {
    const clean = cleanText(item);
    if (!clean) continue;
    const lines = pdf.splitTextToSize(clean, CONTENT_WIDTH - 6);
    if (y > PAGE_HEIGHT - 20) break;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(40, 40, 40);
    pdf.text('•', MARGIN, y);
    pdf.text(lines[0], MARGIN + 4, y);
    y += 5;
    for (let i = 1; i < lines.length; i++) {
      if (y > PAGE_HEIGHT - 20) break;
      pdf.text(lines[i], MARGIN + 4, y);
      y += 5;
    }
    y += 1;
  }
  return y + 3;
}

function addInfoRow(pdf: jsPDF, label: string, value: string, y: number, bold = false): number {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(50, 50, 50);
  pdf.text(label, MARGIN, y);
  pdf.setFont('helvetica', bold ? 'bold' : 'normal');
  pdf.setTextColor(20, 20, 20);
  const valueLines = pdf.splitTextToSize(value || '-', CONTENT_WIDTH - 50);
  pdf.text(valueLines[0] || '-', MARGIN + 48, y);
  y += 5.5;
  for (let i = 1; i < valueLines.length; i++) {
    pdf.text(valueLines[i], MARGIN + 48, y);
    y += 5.5;
  }
  return y;
}

export async function generateProjectCompletionReportPdf(report: ProjectCompletionReport) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const totalPagesPlaceholder = '{total_pages_count_string}';

  // ---------- Page 1: Title page ----------
  pdf.setFillColor(248, 250, 255);
  pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  try {
    pdf.addImage(SMART_UNIVERSE_LOGO_BASE64, 'PNG', 78, 28, 54, 22);
  } catch {
    // Logo optional
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(30, 64, 175);
  pdf.text('PROJECT COMPLETION REPORT', PAGE_WIDTH / 2, 68, { align: 'center' });

  pdf.setFontSize(16);
  pdf.setTextColor(20, 20, 20);
  pdf.text(cleanText(report.title) || 'Project Completion Report', PAGE_WIDTH / 2, 82, { align: 'center' });

  if (report.subtitle) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(80, 80, 80);
    const subLines = pdf.splitTextToSize(cleanText(report.subtitle), CONTENT_WIDTH - 30);
    let subY = 90;
    for (const line of subLines) {
      pdf.text(line, PAGE_WIDTH / 2, subY, { align: 'center' });
      subY += 5.5;
    }
  }

  pdf.setDrawColor(180, 190, 210);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN, 112, PAGE_WIDTH - MARGIN, 112);

  let y = 124;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(30, 64, 175);
  pdf.text('Report Details', MARGIN, y);
  y += 8;
  y = addInfoRow(pdf, 'Client:', report.clientName, y, true);
  if (report.clientFormerName) y = addInfoRow(pdf, 'Formerly Known As:', report.clientFormerName, y);
  y = addInfoRow(pdf, 'Contractor:', report.contractorName || COMPANY.legalName, y);
  y = addInfoRow(pdf, 'Project Location:', report.projectLocation, y);
  y = addInfoRow(pdf, 'Date of Completion:', formatDate(report.completionDate), y);
  y = addInfoRow(pdf, 'Submission Date:', formatDate(report.submissionDate), y);
  y = addInfoRow(pdf, 'Version:', report.version, y);
  y = addInfoRow(pdf, 'Project Manager:', report.projectManager, y);
  y = addInfoRow(pdf, 'Report No:', report.reportNumber, y);

  addPageChrome(pdf, 1, totalPagesPlaceholder);
  pdf.addPage();

  // ---------- Page 2: Submission info + TOC ----------
  let pageNumber = 2;
  addPageChrome(pdf, pageNumber, totalPagesPlaceholder);
  y = 24;
  y = addSectionTitle(pdf, 'Document Information', y);
  y = addInfoRow(pdf, 'Submission Date:', formatDate(report.submissionDate), y);
  y = addInfoRow(pdf, 'Version:', report.version, y);
  y = addInfoRow(pdf, 'Client:', report.clientName, y);
  y = addInfoRow(pdf, 'Contractor:', report.contractorName || COMPANY.legalName, y);
  y += 8;

  y = addSectionTitle(pdf, 'Table of Contents', y);
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
  pdf.setTextColor(40, 40, 40);
  for (const item of toc) {
    pdf.text(item, MARGIN + 2, y);
    y += 6.5;
  }

  pdf.addPage();
  pageNumber += 1;
  addPageChrome(pdf, pageNumber, totalPagesPlaceholder);

  // ---------- 1. Introduction ----------
  y = 24;
  y = addSectionTitle(pdf, '1. Introduction', y);
  y = addParagraph(pdf, report.introduction, y);

  // ---------- 2. Project Overview ----------
  y += 4;
  y = addSectionTitle(pdf, '2. Project Overview', y);
  y = addInfoRow(pdf, 'Project Name:', report.title, y, true);
  y = addInfoRow(pdf, 'Client:', report.clientName, y);
  y = addInfoRow(pdf, 'Date of Completion:', formatDate(report.completionDate), y);
  y = addInfoRow(pdf, 'Project Location:', report.projectLocation, y);
  y = addInfoRow(pdf, 'Contractor:', report.contractorName || COMPANY.legalName, y);
  y = addInfoRow(pdf, 'Project Manager:', report.projectManager, y);
  y += 2;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(40, 40, 40);
  pdf.text('Scope of Work:', MARGIN, y);
  y += 5.5;
  y = addParagraph(pdf, report.scopeOfWork, y);

  // ---------- 3. Project Scope ----------
  y += 4;
  if (y > PAGE_HEIGHT - 40) {
    pdf.addPage();
    pageNumber += 1;
    addPageChrome(pdf, pageNumber, totalPagesPlaceholder);
    y = 24;
  }
  y = addSectionTitle(pdf, '3. Project Scope', y);
  y = addParagraph(pdf, report.scopeContent, y);

  // ---------- 4. Execution Details ----------
  y += 4;
  if (y > PAGE_HEIGHT - 40) {
    pdf.addPage();
    pageNumber += 1;
    addPageChrome(pdf, pageNumber, totalPagesPlaceholder);
    y = 24;
  }
  y = addSectionTitle(pdf, '4. Execution Details', y);
  const executionSections: { key: string; label: string }[] = [
    { key: 'civilWork', label: 'a. Civil Work' },
    { key: 'cableConduit', label: 'b. Cable & Conduit Installation' },
    { key: 'networkHardware', label: 'c. Network Hardware' },
    { key: 'layingPulling', label: 'd. Laying & Pulling Activities' },
    { key: 'splicingTermination', label: 'e. Splicing & Termination' },
  ];
  for (const section of executionSections) {
    const items: string[] = report.executionDetails?.[section.key] || [];
    if (y > PAGE_HEIGHT - 30) {
      pdf.addPage();
      pageNumber += 1;
      addPageChrome(pdf, pageNumber, totalPagesPlaceholder);
      y = 24;
    }
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.5);
    pdf.setTextColor(30, 40, 60);
    pdf.text(section.label, MARGIN, y);
    y += 5.5;
    if (items.length) {
      y = addBulletList(pdf, items, y);
    } else {
      y += 2;
    }
  }

  // ---------- 5. Testing and Verification ----------
  if (y > PAGE_HEIGHT - 40) {
    pdf.addPage();
    pageNumber += 1;
    addPageChrome(pdf, pageNumber, totalPagesPlaceholder);
    y = 24;
  }
  y = addSectionTitle(pdf, '5. Testing and Verification', y);
  y = addParagraph(pdf, report.testingDetails, y);

  // ---------- 6. Project Photos ----------
  if (y > PAGE_HEIGHT - 30) {
    pdf.addPage();
    pageNumber += 1;
    addPageChrome(pdf, pageNumber, totalPagesPlaceholder);
    y = 24;
  }
  y = addSectionTitle(pdf, '6. Project Photos', y);
  const photos = report.photos || [];
  if (photos.length) {
    y += 2;
    const photoWidth = 86;
    const photoHeight = 92;
    let row = 0;
    for (const photo of photos) {
      if (!photo.dataUrl) continue;
      const x = MARGIN + row * (photoWidth + 6);
      try {
        if (y > PAGE_HEIGHT - photoHeight - 18) {
          pdf.addPage();
          pageNumber += 1;
          addPageChrome(pdf, pageNumber, totalPagesPlaceholder);
          y = 24;
          row = 0;
        }
        pdf.addImage(photo.dataUrl, 'PNG', x, y, photoWidth, photoHeight);
        if (photo.name) {
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(7.5);
          pdf.setTextColor(100, 100, 100);
          pdf.text(photo.name, x, y + photoHeight + 3.5, { maxWidth: photoWidth, align: 'center' });
        }
        row += 1;
        if (row === 2) {
          y += photoHeight + (photos.some((p) => p.name) ? 10 : 6);
          row = 0;
        }
      } catch {
        // Skip images that cannot be embedded
      }
    }
  } else {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    pdf.text('No project photos uploaded.', MARGIN, y);
    y += 6;
  }

  // ---------- 7. Conclusion ----------
  y += 4;
  if (y > PAGE_HEIGHT - 40) {
    pdf.addPage();
    pageNumber += 1;
    addPageChrome(pdf, pageNumber, totalPagesPlaceholder);
    y = 24;
  }
  y = addSectionTitle(pdf, '7. Conclusion', y);
  y = addParagraph(pdf, report.conclusion, y);

  // ---------- 8. Sign-off ----------
  y += 6;
  if (y > PAGE_HEIGHT - 70) {
    pdf.addPage();
    pageNumber += 1;
    addPageChrome(pdf, pageNumber, totalPagesPlaceholder);
    y = 24;
  }
  y = addSectionTitle(pdf, '8. Sign-off', y);
  y = addParagraph(
    pdf,
    'We, SmartUniit, confirm that the project has been completed as per the agreed-upon specifications. Please find the details of the project completion, testing reports, and documentation attached for your approval.',
    y
  );
  y += 3;

  const signatures = report.signatures || [];
  if (signatures.length) {
    for (const sig of signatures) {
      if (y > PAGE_HEIGHT - 58) {
        pdf.addPage();
        pageNumber += 1;
        addPageChrome(pdf, pageNumber, totalPagesPlaceholder);
        y = 24;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(20, 20, 20);
      pdf.text(sig.label || 'Representative', MARGIN, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Name: ${sig.name || '-'}`, MARGIN, y + 5);
      if (sig.designation) {
        pdf.text(`Designation: ${sig.designation}`, MARGIN, y + 10);
      }
      pdf.text(`Date: ${formatDate(sig.date)}`, MARGIN + 95, y + 5);
      pdf.setDrawColor(120, 120, 120);
      pdf.setLineWidth(0.3);
      pdf.line(MARGIN, y + 27, MARGIN + 80, y + 27);
      pdf.setFontSize(8.5);
      pdf.setTextColor(120, 120, 120);
      pdf.text('Signature', MARGIN, y + 30.5);
      if (sig.signature) {
        try {
          pdf.addImage(sig.signature, 'PNG', MARGIN + 4, y + 12, 52, 16);
        } catch {
          // Signature image optional
        }
      }
      y += 38;
    }
  } else {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    pdf.text('No signatures captured.', MARGIN, y);
    y += 6;
  }

  // Stamp page numbers (replace placeholder with actual totals)
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    const header = `Page ${i} (${totalPages})`;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text(header, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 8, { align: 'right' });
  }

  return pdf;
}
