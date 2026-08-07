import { Customer, Vendor } from './index';

export interface PurchaseOrderLineItem {
  id: string;
  itemCode?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  direction: 'issued' | 'received';
  vendorId?: string;
  customerId?: string;
  vendor?: Vendor;
  customer?: Customer;
  status: 'draft' | 'issued' | 'received' | 'approved' | 'fulfilled' | 'cancelled';
  poDate: Date;
  referenceNumber?: string;
  quotationReference?: string;
  currency: string;
  lineItems: PurchaseOrderLineItem[];
  subtotal: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  notes?: string;
  deliveryAddress?: string;
  paymentTerms?: string;
  companyContactName?: string;
  companyContactPhone?: string;
  companyContactEmail?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
