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
  status: 'draft' | 'completed';
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}
