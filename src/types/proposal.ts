export interface Proposal {
  id: string;
  title: string;
  description: string;
  customerId: string;
  vendorId?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'won' | 'lost';
  value?: number;
  
  // Document Control
  documentControl: DocumentControl;
  
  // Main Sections
  introduction: Introduction;
  requirementUnderstanding: RequirementUnderstanding;
  siteDesign?: ProposalSiteDesign;
  customerPrerequisites: CustomerPrerequisites;
  deliverables: Deliverable[];
  additionalConditions: AdditionalCondition[];
  commercialProposal: CommercialProposal;
  paymentTerms: PaymentTerms;
  projectDuration: ProjectDuration;
  
  // Attachments and Activity
  attachments: ProposalAttachment[];
  activityLog: ActivityLogEntry[];
  
  // Customer Logo for PDF Generation
  customerLogo?: string; // Base64 encoded logo data
  logoFile?: File; // Original file object
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentControl {
  documentNumber: string;
  version: string;
  date: Date;
  preparedBy: string;
  reviewedBy?: string;
  approvedBy?: string;
  confidentialityLevel: 'public' | 'confidential' | 'restricted';
}

export interface Introduction {
  documentPurpose: string;
  projectOverview: string;
  objectives: string[];
}

export interface RequirementUnderstanding {
  projectScope: string;
  highLevelRequirements: string[];
  technicalRequirements: string[];
  businessRequirements: string[];
}

export interface ProposalSiteDesign {
  title: string;
  description?: string;
  imageBase64?: string;
  imageMimeType?: string;
  fileName?: string;
  notes: string[];
}

export interface CustomerPrerequisites {
  items: PrerequisiteItem[];
}

export interface PrerequisiteItem {
  id: string;
  description: string;
  responsibility: 'customer' | 'vendor' | 'shared';
  mandatory: boolean;
}

export interface Deliverable {
  id: string;
  title: string;
  description: string;
  tasks: DeliverableTask[];
  acceptanceCriteria: string[];
  timeline: string;
  dependencies?: string[];
}

export interface DeliverableTask {
  id: string;
  description: string;
  details: string[];
  estimatedHours?: number;
  resources?: string[];
}

export interface AdditionalCondition {
  id: string;
  condition: string;
  category: 'scope' | 'responsibility' | 'timeline' | 'payment' | 'risk' | 'general';
}

export interface CommercialProposal {
  items: CommercialItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  currency: string;
  validityPeriod: number; // days
}

export interface CommercialItem {
  id: string;
  serialNumber: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  category?: string;
  notes?: string;
}

export interface PaymentTerms {
  structure: 'milestone' | 'percentage' | 'fixed';
  milestones: PaymentMilestone[];
  currency: string;
  paymentMethod: string[];
  latePenalty?: number;
  advancePayment?: number;
}

export interface PaymentMilestone {
  id: string;
  description: string;
  percentage: number;
  amount: number;
  dueDate?: Date;
  conditions: string[];
}

export interface ProjectDuration {
  totalDays: number;
  startDate?: Date;
  endDate?: Date;
  phases: ProjectPhase[];
  criticalPath: string[];
  assumptions: string[];
}

export interface ProjectPhase {
  id: string;
  name: string;
  duration: number;
  startDay: number;
  endDay: number;
  deliverables: string[];
  dependencies?: string[];
}

export interface ProposalAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  category: 'technical' | 'commercial' | 'legal' | 'reference' | 'other';
  uploadedBy: string;
  uploadedAt: Date;
}

export interface ActivityLogEntry {
  id: string;
  user: string;
  action: string;
  timestamp: Date;
  details?: string;
  section?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  contactPerson?: string;
  designation?: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  contactPerson?: string;
  address?: string;
  website?: string;
}

// Template for Fiber Optic Cable Project
export interface FiberOpticProposalTemplate {
  excavationTasks: ExcavationTask[];
  cableInstallation: CableInstallation[];
  equipmentInstallation: EquipmentInstallation[];
  testingAndHandover: TestingTask[];
}

export interface ExcavationTask {
  id: string;
  description: string;
  length: number;
  width: number;
  depth: number;
  location: string;
  soilType: string;
  manholes: number;
  pipeSize: string;
  pipeClass: string;
}

export interface CableInstallation {
  id: string;
  cableType: string;
  coreCount: number;
  length: number;
  route: string;
  installationMethod: string;
  protection: string[];
}

export interface EquipmentInstallation {
  id: string;
  equipmentType: string;
  location: string;
  specifications: string[];
  accessories: string[];
}

export interface TestingTask {
  id: string;
  testType: string;
  equipment: string;
  procedure: string;
  acceptanceCriteria: string[];
  documentation: string[];
}