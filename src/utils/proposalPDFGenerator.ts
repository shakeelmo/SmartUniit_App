import jsPDF from 'jspdf';
import { Proposal } from '../types/proposal';
import { format } from 'date-fns';
const SMART_UNIVERSE_LOGO_BASE64 = "data:image/jpeg;base64,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";
const SAR_MONEY_PREFIX = '[[SAR_MONEY]]';

type TextValue = string | number | null | undefined;

type TableColumn<T> = {
  header: string;
  width: number;
  align?: 'left' | 'center' | 'right';
  value: (row: T, index: number) => TextValue;
};

type TocEntry = { title: string; page: number };

const RIYAL_MARKER = '[[RIYAL]]';

const PDF_STYLES = {
  coverTitle: 28,
  sectionBar: { fontSize: 12, height: 9 },
  body: { fontSize: 10.5, lineHeight: 5.8, gap: 4 },
  table: { headerFontSize: 9.6, bodyFontSize: 9.2, headerHeight: 9, lineHeight: 5.2, paddingX: 2.5, paddingY: 5.5 },
  footer: { brandFontSize: 8.4, metaFontSize: 7.8 },
  signature: { width: 66 },
};

export class ProposalPDFGenerator {
  private static instance: ProposalPDFGenerator;

  private readonly margin = 18;
  private readonly topMargin = 20;
  private readonly bottomMargin = 20;
  private readonly footerHeight = 14;
  private readonly lineGap = 4.8;
  private readonly sectionGap = 6;

  private pdf!: jsPDF;
  private pageWidth = 210;
  private pageHeight = 297;
  private y = 20;
  private proposalTitle = 'Proposal';
  private documentNumber = '';
  private customerName = 'Customer';
  private customerLogo?: string;
  private tocEntries: TocEntry[] = [];
  private tocPage = 2;
  private companyLogoImage?: string;
  private bankingDetails = { bank: 'Saudi National Bank', iban: 'SA3610000041000000080109', accountNumber: '41000000080109' };
  private companyFooter = 'Smart Universe for Communications and Information Technology | Riyadh, Saudi Arabia | Phone: +966 11 4917295 | Email: info@smartuniit.com';
  private riyalSymbolImage?: string;

  public static getInstance(): ProposalPDFGenerator {
    if (!ProposalPDFGenerator.instance) {
      ProposalPDFGenerator.instance = new ProposalPDFGenerator();
    }
    return ProposalPDFGenerator.instance;
  }

  public async generateProposalPDF(proposal: Proposal, customer: any): Promise<void> {
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.companyLogoImage = this.createSmartUniverseLogoImage();
    this.riyalSymbolImage = await this.loadRiyalSymbolImage();
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.proposalTitle = this.clean(proposal?.title) || 'Proposal';
    this.documentNumber = this.clean(proposal?.documentControl?.documentNumber) || this.clean(proposal?.id) || '';
    this.customerName = this.clean(customer?.company || customer?.name || 'Customer') || 'Customer';
    this.customerLogo = this.getCustomerLogo(proposal, customer);
    this.bankingDetails = (proposal as any)?.bankingDetails || this.bankingDetails;
    this.companyFooter = (proposal as any)?.companyFooter || this.companyFooter;
    this.tocEntries = [];
    this.y = this.topMargin;

    this.renderCoverPage(proposal, customer);
    this.addPage();
    this.tocPage = this.pdf.getCurrentPageInfo().pageNumber;
    this.renderTableOfContents();
    this.addPage();
    this.renderDocumentControl(proposal);
    this.renderDocumentProperty(proposal, customer);
    this.renderConfidentiality(proposal);
    this.renderIntroduction(proposal);
    this.renderRequirements(proposal);
    this.renderSiteDesign(proposal);
    this.renderPrerequisites(proposal);
    this.renderDeliverables(proposal);
    this.renderConditions(proposal);
    this.renderCommercialProposal(proposal);
    this.renderBankingDetails();
    this.renderPaymentTerms(proposal);
    this.renderProjectDuration(proposal);
    this.renderAcceptance();
    this.renderTableOfContents(true);
    this.addPageNumbers();

    this.pdf.save(this.filename(this.proposalTitle));
  }

  private renderCoverPage(proposal: Proposal, customer: any) {
    this.pdf.setFillColor(245, 248, 255);
    this.pdf.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
    this.addLogo(this.margin, 16, 42, 24);
    this.addCustomerLogo(this.pageWidth - this.margin - 42, 16, 42, 24);

    this.pdf.setTextColor(30, 64, 175);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(PDF_STYLES.coverTitle);
    this.centerText('TECHNICAL & COMMERCIAL PROPOSAL', 72);

    this.pdf.setTextColor(17, 24, 39);
    this.pdf.setFontSize(18);
    this.centerText(this.proposalTitle, 91);

    this.pdf.setDrawColor(37, 99, 235);
    this.pdf.setLineWidth(0.8);
    this.pdf.line(35, 102, this.pageWidth - 35, 102);

    const customerName = this.clean(customer?.company || customer?.name || 'Customer');
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(12);
    this.centerText('Prepared for: ' + customerName, 118);
    this.centerText('Document No: ' + (this.documentNumber || 'N/A'), 128);
    const coverDate = proposal?.documentControl?.date || proposal?.createdAt || new Date();
    this.centerText('Date: ' + this.safeFormatDate(coverDate), 138);

    this.pdf.setFontSize(11);
    this.pdf.setTextColor(75, 85, 99);
    this.centerText('Smart Universe for Communications and Information Technology', 250);
    this.centerText('Riyadh, Saudi Arabia', 257);
  }

  private renderDocumentControl(proposal: Proposal) {
    this.sectionTitle('Document Control');
    this.keyValueRows([
      ['Document Number', proposal?.documentControl?.documentNumber],
      ['Version', proposal?.documentControl?.version],
      ['Date', this.safeFormatDate(proposal?.documentControl?.date)],
      ['Prepared By', proposal?.documentControl?.preparedBy],
      ['Reviewed By', proposal?.documentControl?.reviewedBy],
      ['Approved By', proposal?.documentControl?.approvedBy],
      ['Confidentiality', proposal?.documentControl?.confidentialityLevel],
    ]);
  }

  private renderTableOfContents(rewrite = false) {
    if (rewrite) {
      this.pdf.setPage(this.tocPage);
      this.clearContentArea();
      this.y = 30;
    }

    this.sectionTitle('Table of Contents', false);
    const entries = this.tocEntries.length
      ? this.tocEntries
      : [
          'Document Control',
          '1. Document Property',
          '2. Confidentiality Agreement',
          '3. Introduction',
          '4. Understanding to Customer Requirement',
          '5. Diagram / Site Design',
          '6. Customer Prerequisites',
          '7. Deliverables Scope',
          '8. Additional Conditions and Assumptions',
          '9. Commercial Proposal',
          '10. Banking Details',
          '11. Payment Terms & Conditions',
          '12. Duration of Project',
          '13. SOW Acceptance',
        ].map(title => ({ title, page: 0 }));

    entries.forEach((entry, index) => {
      this.ensureSpace(8);
      const label = String(index + 1).padStart(2, '0');
      const title = this.clean(entry.title.replace(/^\d+\.\s*/, ''));
      const pageText = entry.page ? String(entry.page) : '-';
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(9.2);
      this.pdf.setTextColor(30, 64, 175);
      this.pdf.text(label, this.margin, this.y);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(17, 24, 39);
      this.pdf.text(title, this.margin + 12, this.y, { maxWidth: this.contentWidth() - 32 });
      this.pdf.setDrawColor(209, 213, 219);
      this.pdf.setLineDashPattern([1, 1], 0);
      this.pdf.line(this.margin + 75, this.y - 1, this.pageWidth - this.margin - 12, this.y - 1);
      this.pdf.setLineDashPattern([], 0);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(pageText, this.pageWidth - this.margin, this.y, { align: 'right' });
      this.y += 8;
    });
    this.y += this.sectionGap;
    this.pdf.setTextColor(17, 24, 39);
  }

  private renderDocumentProperty(proposal: Proposal, customer: any) {
    this.sectionTitle('1. Document Property');
    this.keyValueRows([
      ['Proposal Title', proposal?.title],
      ['Customer', customer?.company || customer?.name],
      ['Customer Contact', customer?.contactPerson || customer?.email],
      ['Status', proposal?.status],
      ['Estimated Value', this.moneyMarker(proposal?.value || proposal?.commercialProposal?.total, proposal?.commercialProposal?.currency)],
    ]);
    if (proposal?.description) this.paragraph(proposal.description);
  }

  private renderConfidentiality(proposal: Proposal) {
    this.sectionTitle('2. Confidentiality Agreement');
    const level = this.clean(proposal?.documentControl?.confidentialityLevel || 'confidential');
    this.paragraph('This proposal is marked as ' + level + '. The information contained in this document is intended only for the recipient and may include technical, commercial, and operational details prepared for the requested scope of work.');
  }

  private renderIntroduction(proposal: Proposal) {
    this.sectionTitle('3. Introduction');
    this.subTitle('Document Purpose');
    this.paragraph(proposal?.introduction?.documentPurpose || 'This document presents the technical and commercial proposal for the requested services.');
    if (proposal?.introduction?.projectOverview) {
      this.subTitle('Project Overview');
      this.paragraph(proposal.introduction.projectOverview);
    }
    this.list('Objectives', proposal?.introduction?.objectives);
  }

  private renderRequirements(proposal: Proposal) {
    this.sectionTitle('4. Understanding to Customer Requirement');
    this.paragraph(proposal?.requirementUnderstanding?.projectScope || 'The high-level project scope and requirements are documented below.');
    this.list('High-Level Requirements', proposal?.requirementUnderstanding?.highLevelRequirements);
    this.list('Technical Requirements', proposal?.requirementUnderstanding?.technicalRequirements);
    this.list('Business Requirements', proposal?.requirementUnderstanding?.businessRequirements);
  }

  private renderSiteDesign(proposal: Proposal) {
    const siteDesign = proposal?.siteDesign;
    const title = this.clean(siteDesign?.title) || 'Diagram / Site Design';
    const notes = (siteDesign?.notes || []).map(note => this.clean(note)).filter(Boolean);
    const hasImage = Boolean(siteDesign?.imageBase64 && siteDesign?.imageMimeType);
    const hasContent = Boolean(this.clean(siteDesign?.description) || hasImage || notes.length);
    if (!hasContent) return;

    this.sectionTitle('5. ' + title);
    if (siteDesign?.description) this.paragraph(siteDesign.description);

    if (hasImage) {
      const imageData = `data:${siteDesign?.imageMimeType || 'image/png'};base64,${siteDesign?.imageBase64}`;
      const imageWidth = this.contentWidth();
      const imageHeight = Math.min(96, imageWidth * 0.56);
      this.ensureSpace(imageHeight + 8);
      try {
        const imageType = siteDesign?.imageMimeType?.includes('png') ? 'PNG' : 'JPEG';
        this.pdf.setDrawColor(209, 213, 219);
        this.pdf.setFillColor(249, 250, 251);
        this.pdf.roundedRect(this.margin, this.y, imageWidth, imageHeight, 1.5, 1.5, 'FD');
        this.pdf.addImage(imageData, imageType, this.margin + 2, this.y + 2, imageWidth - 4, imageHeight - 4, undefined, 'FAST');
        this.y += imageHeight + 6;
      } catch (error) {
        console.warn('Unable to add proposal site design image:', error);
        this.paragraph('Diagram image could not be embedded in the PDF.');
      }
    }

    this.list('Design Notes', notes);
  }

  private renderPrerequisites(proposal: Proposal) {
    this.sectionTitle('6. Customer Prerequisites');
    const rows = proposal?.customerPrerequisites?.items || [];
    if (!rows.length) {
      this.paragraph('No prerequisites have been listed.');
      return;
    }
    this.table(rows, [
      { header: '#', width: 10, align: 'center', value: (_row, i) => i + 1 },
      { header: 'Description', width: 104, value: row => row.description },
      { header: 'Responsibility', width: 28, align: 'center', value: row => row.responsibility },
      { header: 'Mandatory', width: 24, align: 'center', value: row => row.mandatory ? 'Yes' : 'No' },
    ]);
  }

  private renderDeliverables(proposal: Proposal) {
    this.sectionTitle('7. Deliverables Scope');
    const deliverables = proposal?.deliverables || [];
    if (!deliverables.length) {
      this.paragraph('No deliverables have been listed.');
      return;
    }

    deliverables.forEach((deliverable, index) => {
      this.keepWithNext(18);
      this.subTitle('7.' + (index + 1) + ' ' + (this.clean(deliverable.title) || 'Deliverable'));
      if (deliverable.description) this.paragraph(deliverable.description);
      if (deliverable.timeline) this.paragraph('Timeline: ' + deliverable.timeline);

      (deliverable.tasks || []).forEach((task, taskIndex) => {
        this.bullet((index + 1) + '.' + (taskIndex + 1) + ' ' + this.clean(task.description), 1);
        (task.details || []).forEach(detail => this.bullet(detail, 2));
        if (task.estimatedHours) this.bullet('Estimated hours: ' + task.estimatedHours, 2);
        (task.resources || []).forEach(resource => this.bullet('Resource: ' + resource, 2));
      });

      this.list('Acceptance Criteria', deliverable.acceptanceCriteria, 1);
      this.list('Dependencies', deliverable.dependencies, 1);
      this.y += 2;
    });
  }

  private renderConditions(proposal: Proposal) {
    this.sectionTitle('8. Additional Conditions and Assumptions');
    const rows = proposal?.additionalConditions || [];
    if (!rows.length) {
      this.paragraph('No additional conditions have been listed.');
      return;
    }
    rows.forEach((condition, index) => {
      const category = condition.category ? '[' + condition.category + '] ' : '';
      this.bullet((index + 1) + '. ' + category + condition.condition, 0, false);
    });
    this.y += this.sectionGap;
  }

  private renderCommercialProposal(proposal: Proposal) {
    this.sectionTitle('9. Commercial Proposal');
    const commercial = proposal?.commercialProposal;
    const rows = commercial?.items || [];
    if (!rows.length) {
      this.paragraph('No commercial items have been listed.');
    } else {
      this.table(rows, [
        { header: 'S.No', width: 12, align: 'center', value: (row, i) => row.serialNumber || i + 1 },
        { header: 'Description', width: 78, value: row => row.description },
        { header: 'Qty', width: 16, align: 'center', value: row => row.quantity },
        { header: 'Unit', width: 18, align: 'center', value: row => row.unit },
        { header: 'Unit Price', width: 25, align: 'right', value: row => this.moneyMarker(row.unitPrice, commercial.currency) },
        { header: 'Total', width: 27, align: 'right', value: row => this.moneyMarker(row.total, commercial.currency) },
      ], { fontSize: PDF_STYLES.table.bodyFontSize });
    }

    this.keepWithNext(32);
    const currency = commercial?.currency || 'SAR';
    this.keyValueRows([
      ['Subtotal', this.moneyMarker(commercial?.subtotal, currency)],
      ['VAT (' + (commercial?.vatRate ?? 0) + '%)', this.moneyMarker(commercial?.vatAmount, currency)],
      ['Grand Total', this.moneyMarker(commercial?.total, currency)],
      ['Validity Period', commercial?.validityPeriod ? commercial.validityPeriod + ' days' : 'N/A'],
    ], this.pageWidth - this.margin - 82, 82);
  }

  private renderBankingDetails() {
    this.sectionTitle('10. Banking Details');
    this.keyValueRows([
      ['Bank', this.bankingDetails.bank],
      ['IBAN', this.bankingDetails.iban],
      ['Account Number', this.bankingDetails.accountNumber],
    ]);
  }
  private getPaymentMilestonesForDisplay(proposal: Proposal) {
    const terms = proposal?.paymentTerms;
    const total = Number(proposal?.commercialProposal?.total || proposal?.value || 0);
    const currency = terms?.currency || proposal?.commercialProposal?.currency || 'SAR';
    const milestones = terms?.milestones || [];
    const advance = Number(terms?.advancePayment || 0);

    if (advance > 0 && milestones.length === 2) {
      const first = this.clean(milestones[0]?.description).toLowerCase();
      const second = this.clean(milestones[1]?.description).toLowerCase();
      if (first.includes('advance') && second.includes('final')) {
        return [
          { ...milestones[0], percentage: advance, amount: total * advance / 100 },
          { ...milestones[1], percentage: 100 - advance, amount: total * (100 - advance) / 100 },
        ];
      }
    }

    return milestones.map(milestone => {
      const percentage = Number(milestone.percentage || 0);
      const amount = Number(milestone.amount || 0) || (total && percentage ? total * percentage / 100 : 0);
      return { ...milestone, percentage, amount, currency };
    });
  }
  private renderPaymentTerms(proposal: Proposal) {
    this.sectionTitle('11. Payment Terms & Conditions');
    const terms = proposal?.paymentTerms;
    const currency = (terms?.currency || proposal?.commercialProposal?.currency || 'SAR').toUpperCase();
    this.keyValueRows([
      ['Structure', terms?.structure],
      ['Payment Method', (terms?.paymentMethod || []).join(', ')],
      ['Advance Payment', terms?.advancePayment ? terms.advancePayment + '%' : 'N/A'],
    ]);

    const milestones = this.getPaymentMilestonesForDisplay(proposal);
    if (milestones.length) {
      this.subTitle('Milestones');
      milestones.forEach((milestone, index) => {
        const amountText = this.money(milestone.amount, currency);
        const amountValue = currency === 'SAR' ? this.stripRiyalMarker(amountText) : this.clean(amountText);
        const formattedAmount = currency === 'SAR' ? 'SAR ' + amountValue : amountValue;
        this.paragraph((index + 1) + '. ' + milestone.description + ': ' + milestone.percentage + '% (' + formattedAmount + ')');
        (milestone.conditions || []).forEach(condition => this.bullet(condition, 1));
        this.y += 1.5;
      });
    }
  }

  private renderProjectDuration(proposal: Proposal) {
    this.sectionTitle('12. Duration of Project');
    const duration = proposal?.projectDuration;
    this.paragraph('This project is expected to be completed within ' + (duration?.totalDays || 0) + ' days.');
    this.keyValueRows([
      ['Start Date', duration?.startDate ? this.safeFormatDate(duration.startDate) : 'To be agreed'],
      ['End Date', duration?.endDate ? this.safeFormatDate(duration.endDate) : 'To be agreed'],
    ]);

    if (duration?.phases?.length) {
      this.subTitle('Project Phases');
      this.table(duration.phases, [
        { header: 'Phase', width: 48, value: row => row.name },
        { header: 'Duration', width: 24, align: 'center', value: row => row.duration + ' days' },
        { header: 'Days', width: 24, align: 'center', value: row => row.startDay + '-' + row.endDay },
        { header: 'Deliverables', width: 80, value: row => (row.deliverables || []).join(', ') },
      ], { fontSize: PDF_STYLES.table.bodyFontSize });
    }

    this.list('Critical Path', duration?.criticalPath);
    this.list('Assumptions', duration?.assumptions);
  }


  private renderAcceptance() {
    this.sectionTitle('13. SOW Acceptance');
    this.paragraph('By signing this document, the SOW document is officially approved and acknowledged as the only document that defines the project scope based on the signed contract.');
    this.keepWithNext(45);
    this.y += 14;
    const width = PDF_STYLES.signature.width;
    const leftX = this.margin;
    const rightX = this.pageWidth - this.margin - width;
    this.pdf.setDrawColor(17, 24, 39);
    this.pdf.line(leftX, this.y, leftX + width, this.y);
    this.pdf.line(rightX, this.y, rightX + width, this.y);
    this.y += 6;
    this.text('Customer Signature & Date', leftX, this.y, 9.5);
    this.text('Company Signature & Date', rightX, this.y, 9.5);
  }

  private registerToc(title: string) {
    const page = this.pdf.getCurrentPageInfo().pageNumber;
    if (!this.tocEntries.some(entry => entry.title === title)) {
      this.tocEntries.push({ title, page });
    }
  }

  private clearContentArea() {
    this.pdf.setFillColor(255, 255, 255);
    this.pdf.rect(this.margin - 1, 24, this.contentWidth() + 2, this.pageBottom() - 22, 'F');
  }


  private sectionTitle(title: string, includeInToc = true) {
    if (includeInToc) this.registerToc(title);
    this.keepWithNext(20);
    const style = PDF_STYLES.sectionBar;
    this.pdf.setFillColor(30, 64, 175);
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.roundedRect(this.margin, this.y, this.contentWidth(), style.height, 1.5, 1.5, 'F');
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(style.fontSize);
    this.pdf.text(title.toUpperCase(), this.margin + 3, this.y + 6.2);
    this.y += style.height + 6;
    this.pdf.setTextColor(17, 24, 39);
  }


  private subTitle(title: string) {
    if (!this.clean(title)) return;
    this.keepWithNext(11);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(11);
    this.pdf.setTextColor(30, 64, 175);
    this.pdf.text(title, this.margin, this.y);
    this.y += 6.5;
    this.pdf.setTextColor(17, 24, 39);
  }


  private paragraph(value: TextValue, indent = 0, fontSize = PDF_STYLES.body.fontSize) {
    const text = this.clean(value);
    if (!text) return;
    const x = this.margin + indent;
    const maxWidth = this.contentWidth() - indent;
    this.writeWrapped(text, x, maxWidth, fontSize, PDF_STYLES.body.lineHeight);
    this.y += PDF_STYLES.body.gap;
  }

  private list(title: string, items?: TextValue[], indent = 0) {
    const cleanItems = (items || []).map(item => this.clean(item)).filter(Boolean);
    if (!cleanItems.length) return;
    this.subTitle(title);
    cleanItems.forEach(item => this.bullet(item, indent));
    this.y += 2;
  }


  private bullet(value: TextValue, level = 0, bullet = true) {
    const text = this.clean(value);
    if (!text) return;
    const x = this.margin + level * 6;
    const prefix = bullet ? (level > 0 ? '-' : '•') : '';
    const firstIndent = prefix ? 4 : 0;
    const lineHeight = PDF_STYLES.body.lineHeight;
    const lines = this.pdf.splitTextToSize(text, this.contentWidth() - level * 6 - firstIndent);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);
    lines.forEach((line: string, index: number) => {
      this.ensureSpace(lineHeight);
      if (prefix && index === 0) this.pdf.text(prefix, x, this.y);
      this.pdf.text(line, x + firstIndent, this.y);
      this.y += lineHeight;
    });
    this.y += 1.2;
  }


  private writeWrapped(value: string, x: number, maxWidth: number, fontSize = PDF_STYLES.body.fontSize, lineHeight = PDF_STYLES.body.lineHeight) {
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(fontSize);
    const lines = this.pdf.splitTextToSize(value, maxWidth);
    lines.forEach((line: string) => {
      this.ensureSpace(lineHeight);
      this.pdf.text(line, x, this.y);
      this.y += lineHeight;
    });
  }


  private keyValueRows(rows: Array<[string, TextValue]>, x = this.margin, width = this.contentWidth()) {
    const labelWidth = Math.min(45, width * 0.42);
    rows
      .filter(([, value]) => this.clean(value))
      .forEach(([label, value]) => {
        const text = this.clean(value) || 'N/A';
        const valueLines = this.pdf.splitTextToSize(text, width - labelWidth - 5);
        const rowHeight = Math.max(8.5, valueLines.length * 5.2 + 4);
        this.ensureSpace(rowHeight);
        this.pdf.setDrawColor(229, 231, 235);
        this.pdf.setFillColor(249, 250, 251);
        this.pdf.rect(x, this.y - 4.8, width, rowHeight, 'S');
        this.pdf.setFontSize(9.8);
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text(label, x + 2.5, this.y);
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(9.5);
        if (this.isRiyalValue(text)) {
          this.drawRiyalValue(text, x + labelWidth, this.y, { maxWidth: width - labelWidth - 5 });
        } else {
          this.pdf.text(valueLines, x + labelWidth, this.y, { maxWidth: width - labelWidth - 5 });
        }
        this.y += rowHeight;
      });
    this.y += PDF_STYLES.body.gap;
  }


  private table<T>(rows: T[], columns: TableColumn<T>[], options: { fontSize?: number } = {}) {
    const fontSize = options.fontSize || PDF_STYLES.table.bodyFontSize;
    const lineHeight = PDF_STYLES.table.lineHeight;
    const headerHeight = PDF_STYLES.table.headerHeight;
    const padX = PDF_STYLES.table.paddingX;

    const drawHeader = () => {
      this.ensureSpace(headerHeight + 4);
      let x = this.margin;
      this.pdf.setFillColor(30, 64, 175);
      this.pdf.setDrawColor(37, 99, 235);
      this.pdf.setTextColor(255, 255, 255);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(PDF_STYLES.table.headerFontSize);
      columns.forEach(col => {
        this.pdf.rect(x, this.y, col.width, headerHeight, 'F');
        this.pdf.rect(x, this.y, col.width, headerHeight, 'S');
        const align = col.align || 'left';
        const textX = align === 'right' ? x + col.width - padX : align === 'center' ? x + col.width / 2 : x + padX;
        const headerText = this.clean(col.header) || `Column ${colIndex + 1}`;
        this.pdf.text(headerText, textX, this.y + 6, { align, maxWidth: col.width - padX * 2 });
        x += col.width;
      });
      this.y += headerHeight;
      this.pdf.setTextColor(17, 24, 39);
    };

    drawHeader();
    rows.forEach((row, rowIndex) => {
      const rawValues = columns.map(col => col.value(row, rowIndex));
      const cellLines = columns.map((col, colIndex) => this.pdf.splitTextToSize(this.clean(rawValues[colIndex]), col.width - padX * 2));
      const rowHeight = Math.max(9.5, Math.max(...cellLines.map(lines => lines.length)) * lineHeight + PDF_STYLES.table.paddingY);
      if (this.y + rowHeight > this.pageBottom()) {
        this.addPage();
        drawHeader();
      }

      let x = this.margin;
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(fontSize);
      this.pdf.setDrawColor(209, 213, 219);
      columns.forEach((col, colIndex) => {
        this.pdf.rect(x, this.y, col.width, rowHeight);
        const align = col.align || 'left';
        const textX = align === 'right' ? x + col.width - padX : align === 'center' ? x + col.width / 2 : x + padX;
        if (this.isRiyalValue(rawValues[colIndex])) {
          this.drawRiyalValue(rawValues[colIndex], textX, this.y + 6, { align, maxWidth: col.width - padX * 2 });
        } else {
          this.pdf.text(cellLines[colIndex], textX, this.y + 6, { align, maxWidth: col.width - padX * 2 });
        }
        x += col.width;
      });
      this.y += rowHeight;
    });
    this.y += this.sectionGap;
  }

  private ensureSpace(requiredHeight: number) {
    if (this.y + requiredHeight > this.pageBottom()) this.addPage();
  }

  private keepWithNext(requiredHeight: number) {
    this.ensureSpace(requiredHeight);
  }

  private addPage() {
    this.pdf.addPage();
    this.y = this.topMargin;
    this.addRunningHeader();
  }


  private addRunningHeader() {
    this.pdf.setFillColor(255, 255, 255);
    this.pdf.rect(0, 0, this.pageWidth, 28, 'F');
    this.addLogo(this.margin, 7, 32, 18);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(30, 64, 175);
    this.pdf.text('Smart Universe', this.margin + 36, 14);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(7.8);
    this.pdf.setTextColor(75, 85, 99);
    this.pdf.text('Communications & Information Technology', this.margin + 36, 19);

    this.addCustomerLogo(this.pageWidth - this.margin - 32, 7, 32, 18);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(7.8);
    this.pdf.setTextColor(75, 85, 99);
    this.pdf.text(this.customerName, this.pageWidth - this.margin - 36, 15, { align: 'right', maxWidth: 48 });

    this.pdf.setDrawColor(219, 234, 254);
    this.pdf.line(this.margin, 28, this.pageWidth - this.margin, 28);
    this.y = 36;
    this.pdf.setTextColor(17, 24, 39);
  }


  private addPageNumbers() {
    const total = this.pdf.getNumberOfPages();
    for (let page = 1; page <= total; page++) {
      this.pdf.setPage(page);
      this.pdf.setFillColor(255, 255, 255);
      this.pdf.rect(0, this.pageHeight - 18, this.pageWidth, 18, 'F');
      this.pdf.setDrawColor(219, 234, 254);
      this.pdf.line(this.margin, this.pageHeight - 18, this.pageWidth - this.margin, this.pageHeight - 18);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(PDF_STYLES.footer.brandFontSize);
      this.pdf.setTextColor(30, 64, 175);
      this.pdf.text('Smart Universe for Communications and Information Technology', this.pageWidth / 2, this.pageHeight - 12, { align: 'center' });
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(PDF_STYLES.footer.metaFontSize);
      this.pdf.setTextColor(75, 85, 99);
      this.pdf.text(this.companyFooter, this.pageWidth / 2, this.pageHeight - 7, { align: 'center', maxWidth: this.contentWidth() });
      this.pdf.setFontSize(PDF_STYLES.footer.metaFontSize);
      this.pdf.text('Page ' + page + ' of ' + total, this.pageWidth - this.margin, this.pageHeight - 7, { align: 'right' });
    }
    this.pdf.setTextColor(17, 24, 39);
  }

  private addLogo(x: number, y: number, width: number, height: number) {
    this.pdf.setFillColor(255, 255, 255);
    this.pdf.roundedRect(x, y, width, height, 1.5, 1.5, 'F');

    if (this.companyLogoImage) {
      try {
        const ratio = 150 / 97;
        const boxRatio = width / height;
        const drawWidth = boxRatio > ratio ? height * ratio : width;
        const drawHeight = boxRatio > ratio ? height : width / ratio;
        const drawX = x + (width - drawWidth) / 2;
        const drawY = y + (height - drawHeight) / 2;
        this.pdf.addImage(this.companyLogoImage, 'PNG', drawX, drawY, drawWidth, drawHeight, undefined, 'FAST');
        return;
      } catch (error) {
        console.warn('Unable to add generated Smart Universe logo:', error);
      }
    }

    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(234, 124, 35);
    this.pdf.setFontSize(Math.min(14, height * 0.52));
    this.pdf.text('SMART', x + width / 2, y + height * 0.43, { align: 'center' });
    this.pdf.setTextColor(17, 24, 95);
    this.pdf.setFontSize(Math.min(12, height * 0.46));
    this.pdf.text('UNIVERSE', x + width / 2, y + height * 0.72, { align: 'center' });
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(17, 24, 39);
  }

  private createSmartUniverseLogoImage(): string | undefined {
    if (typeof document === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 194;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ea7c23';
    ctx.beginPath();
    ctx.ellipse(160, 90, 105, 67, -0.18, 0.95 * Math.PI, 2.18 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(68, 48);
    ctx.lineTo(92, 18);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'italic 700 58px Arial, Helvetica, sans-serif';
    ctx.fillStyle = '#ea7c23';
    ctx.fillText('SMART', 150, 76);
    ctx.font = '900 51px Arial, Helvetica, sans-serif';
    ctx.fillStyle = '#11185f';
    ctx.fillText('UNIVERSE', 150, 122);

    return canvas.toDataURL('image/png');
  }

  private addCustomerLogo(x: number, y: number, width: number, height: number) {
    if (this.customerLogo) {
      try {
        const type = this.customerLogo.includes('image/png') ? 'PNG' : 'JPEG';
        this.pdf.addImage(this.customerLogo, type, x, y, width, height);
        return;
      } catch (error) {
        console.warn('Unable to add customer logo:', error);
      }
    }
    this.pdf.setDrawColor(209, 213, 219);
    this.pdf.setFillColor(249, 250, 251);
    this.pdf.roundedRect(x, y, width, height, 1.5, 1.5, 'FD');
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(6.8);
    this.pdf.setTextColor(75, 85, 99);
    this.pdf.text('CUSTOMER', x + width / 2, y + height / 2 - 1, { align: 'center' });
    this.pdf.text('LOGO', x + width / 2, y + height / 2 + 4, { align: 'center' });
    this.pdf.setTextColor(17, 24, 39);
  }

  private getCustomerLogo(proposal: any, customer: any): string | undefined {
    const candidates = [proposal?.customerLogo, customer?.logo, customer?.logoUrl, customer?.logo_url, customer?.image, customer?.imageUrl, customer?.avatar];
    return candidates.find(value => typeof value === 'string' && value.startsWith('data:image/'));
  }

  private contentWidth() {
    return this.pageWidth - this.margin * 2;
  }

  private pageBottom() {
    return this.pageHeight - this.bottomMargin - this.footerHeight;
  }

  private centerText(text: string, y: number) {
    this.pdf.text(text, this.pageWidth / 2, y, { align: 'center', maxWidth: this.contentWidth() });
  }

  private text(text: string, x: number, y: number, fontSize = 10) {
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(fontSize);
    this.pdf.text(text, x, y);
  }

  private clean(value: TextValue): string {
    if (value === null || value === undefined) return '';
    return String(value).replace(/\s+/g, ' ').trim();
  }

  private safeFormatDate(value: any): string {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) {
      return format(new Date(), 'dd/MM/yyyy');
    }
    return format(date, 'dd/MM/yyyy');
  }

  private money(value: any, currency = 'SAR', includeCurrency = true): string {
    const amount = Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const code = (currency || 'SAR').toUpperCase();
    return includeCurrency ? (code === 'SAR' ? RIYAL_MARKER + amount : code + ' ' + amount) : amount;
  }

  private moneyMarker(value: any, currency = 'SAR'): string {
    return this.money(value, currency);
  }
  private displayText(value: TextValue): string {
    const text = this.clean(value);
    return this.isSarMoney(text) ? this.sarAmount(text) : text;
  }

  private isSarMoney(value: TextValue): boolean {
    return this.clean(value).startsWith(SAR_MONEY_PREFIX);
  }

  private sarAmount(value: TextValue): string {
    return this.clean(value).replace(SAR_MONEY_PREFIX, '');
  }

  private drawTextValue(value: TextValue, x: number, y: number, options: { align?: 'left' | 'center' | 'right'; maxWidth?: number; fontSize?: number } = {}) {
    this.pdf.text(this.clean(value), x, y, { align: options.align, maxWidth: options.maxWidth });
  }

  private isRiyalValue(value: TextValue): boolean {
    return this.clean(value).startsWith(RIYAL_MARKER);
  }

  private stripRiyalMarker(value: TextValue): string {
    return this.clean(value).replace(RIYAL_MARKER, '').trim();
  }

  private async loadRiyalSymbolImage(): Promise<string | undefined> {
    if (typeof document === 'undefined') return undefined;
    try {
      const img = new Image();
      img.src = '/Riyal_symbol.svg';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 48;
      const ctx = canvas.getContext('2d');
      if (!ctx) return undefined;
      ctx.clearRect(0, 0, 48, 48);
      ctx.drawImage(img, 0, 0, 48, 48);
      return canvas.toDataURL('image/png');
    } catch {
      return undefined;
    }
  }

  private drawRiyalValue(value: TextValue, x: number, y: number, options: { align?: 'left' | 'center' | 'right'; maxWidth?: number } = {}) {
    const amount = this.stripRiyalMarker(value);
    const align = options.align || 'left';
    const iconW = 3.2;
    const iconH = 3.2;
    const gap = 1.2;
    if (align === 'right') {
      const amountWidth = this.pdf.getTextWidth(amount);
      const startX = x - amountWidth - gap - iconW;
      if (this.riyalSymbolImage) {
        try { this.pdf.addImage(this.riyalSymbolImage, 'PNG', startX, y - 2.7, iconW, iconH, undefined, 'FAST'); } catch {}
      } else {
        this.pdf.text('?', startX, y);
      }
      this.pdf.text(amount, x, y, { align: 'right', maxWidth: options.maxWidth });
      return;
    }
    if (this.riyalSymbolImage) {
      try { this.pdf.addImage(this.riyalSymbolImage, 'PNG', x, y - 2.7, iconW, iconH, undefined, 'FAST'); } catch {}
    } else {
      this.pdf.text('?', x, y);
    }
    this.pdf.text(amount, x + iconW + gap, y, { align: 'left', maxWidth: options.maxWidth });
  }

  private filename(title: string): string {
    const safeTitle = (title || 'Proposal').replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'Proposal';
    return 'Proposal_' + safeTitle + '_' + format(new Date(), 'yyyy-MM-dd') + '.pdf';
  }
}

export const proposalPDFGenerator = ProposalPDFGenerator.getInstance();
