export interface User {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'manager' | 'technician' | 'staff' | 'customer' | 'vendor';
  avatar?: string;
  phone?: string;
  department?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  website?: string;
  notes?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  offering?: string; // What the vendor does
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  company?: string;
  notes?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  customerId: string;
  vendorId?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  value?: number;
  attachments?: string[];
  commercialForm?: any;
  signatureForm?: any;
  documentControl?: any;
  deliverables?: any;
  timeline?: any;
  quotation?: any;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  customerId: string;
  proposalId?: string;
  status: 'planning' | 'active' | 'completed' | 'on-hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string[];
  managerId: string;
  startDate: Date;
  endDate?: Date;
  progress: number;
  budget?: number;
  documents: Document[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assignedTo: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Quotation {
  id: string;
  proposalId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  validUntil: Date;
  terms?: string;
  lineItems: QuotationLineItem[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface QuotationLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  customerId: string;
  projectId?: string;
  quotationId?: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidDate?: Date;
  lineItems: InvoiceLineItem[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CaseStudy {
  id: string;
  title: string;
  description: string;
  customerId: string;
  projectId: string;
  content: string;
  images?: string[];
  tags?: string[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Budget {
  id: string;
  projectId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'approved' | 'active' | 'completed';
  categories: BudgetCategory[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  allocatedAmount: number;
  spentAmount: number;
  description?: string;
}

export interface Document {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface Permission {
  id: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  oldValues?: any;
  newValues?: any;
  timestamp: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userData: { name: string; company?: string; phone?: string }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (resource: string, action: string) => boolean;
}

export interface DashboardStats {
  vendors: {
    total: number;
    active: number;
    inactive: number;
  };
  customers: {
    total: number;
    active: number;
    inactive: number;
  };
  proposals: {
    total: number;
    draft: number;
    submitted: number;
    approved: number;
    rejected: number;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    onHold: number;
  };
  tasks: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
  };
  invoices: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    totalAmount: number;
  };
}