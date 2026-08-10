export interface ReportPhoto {
  name?: string;
  dataUrl: string;
}

export interface ReportSignature {
  label: string;
  name: string;
  designation: string;
  signature: string;
  date: string;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'paragraph' | 'bullets';
  content: string;
}

export interface ProjectCompletionReport {
  id: string;
  reportNumber: string;
  title: string;
  subtitle: string;
  clientName: string;
  clientCompany: string;
  clientFormerName: string;
  clientLogo: string | null;
  clientRepName: string;
  clientRepDesignation: string;
  clientRepPhone: string;
  clientRepEmail: string;
  contractorName: string;
  contractorLogo: string | null;
  submissionDate: string;
  completionDate: string;
  version: string;
  projectLocation: string;
  projectManager: string;
  scopeOfWork: string;
  introduction: string;
  scopeContent: string;
  executionDetails: Record<string, string[]>;
  testingDetails: string;
  conclusion: string;
  photos: ReportPhoto[];
  signatures: ReportSignature[];
  reportType: 'specific' | 'generic';
  sections: ReportSection[];
  status: 'draft' | 'completed';
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}
