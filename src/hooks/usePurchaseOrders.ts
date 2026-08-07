import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Customer, Vendor } from '../types';
import { PurchaseOrder, PurchaseOrderLineItem } from '../types/purchaseOrder';

const mapLineItem = (item: any): PurchaseOrderLineItem => ({
  id: item.id,
  itemCode: item.item_code || item.itemCode || '',
  description: item.description || '',
  quantity: Number(item.quantity) || 0,
  unit: item.unit || 'pcs',
  unitPrice: Number(item.unit_price ?? item.unitPrice) || 0,
  total: Number(item.total_price ?? item.total) || 0,
});

const mapPurchaseOrder = (po: any): PurchaseOrder => ({
  id: po.id,
  poNumber: po.po_number || po.poNumber,
  direction: po.direction || 'issued',
  vendorId: po.vendor_id || po.vendorId || undefined,
  customerId: po.customer_id || po.customerId || undefined,
  vendor: po.vendor_name
    ? {
        id: po.vendor_id,
        name: po.vendor_name,
        email: po.vendor_email || '',
        phone: po.vendor_phone || '',
        address: po.vendor_address || '',
        contactPerson: po.vendor_contact_person || '',
        status: 'active',
        createdBy: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Vendor
    : undefined,
  customer: po.customer_name
    ? {
        id: po.customer_id,
        name: po.customer_name,
        company: po.customer_company || '',
        email: po.customer_email || '',
        phone: po.customer_phone || '',
        address: po.customer_address || '',
        status: 'active',
        createdBy: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Customer
    : undefined,
  status: po.status || 'draft',
  poDate: po.po_date ? new Date(po.po_date) : new Date(),
  referenceNumber: po.reference_number || '',
  quotationReference: po.quotation_reference || '',
  currency: po.currency || 'SAR',
  lineItems: Array.isArray(po.lineItems) ? po.lineItems.map(mapLineItem) : [],
  subtotal: Number(po.subtotal) || 0,
  discountType: po.discount_type || po.discountType || 'percentage',
  discountValue: Number(po.discount_value ?? po.discountValue) || 0,
  discountAmount: Number(po.discount_amount ?? po.discountAmount) || 0,
  vatRate: Number(po.vat_rate ?? po.vatRate) || 15,
  vatAmount: Number(po.vat_amount ?? po.vatAmount) || 0,
  total: Number(po.total_amount ?? po.total) || 0,
  notes: po.notes || '',
  deliveryAddress: po.delivery_address || '',
  paymentTerms: po.payment_terms || '',
  companyContactName: po.company_contact_name || '',
  companyContactPhone: po.company_contact_phone || '',
  companyContactEmail: po.company_contact_email || '',
  createdAt: po.created_at ? new Date(po.created_at) : new Date(),
  updatedAt: po.updated_at ? new Date(po.updated_at) : new Date(),
  createdBy: po.created_by || '',
});

export function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchaseOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.getPurchaseOrders();
      setPurchaseOrders((response.purchaseOrders || []).map(mapPurchaseOrder));
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError('Failed to fetch purchase orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const addPurchaseOrder = async (purchaseOrder: any) => {
    const response = await api.createPurchaseOrder(purchaseOrder);
    await fetchPurchaseOrders();
    return response.purchaseOrder;
  };

  const updatePurchaseOrder = async (id: string, updates: any) => {
    const response = await api.updatePurchaseOrder(id, updates);
    await fetchPurchaseOrders();
    return response.purchaseOrder;
  };

  const deletePurchaseOrder = async (id: string) => {
    await api.deletePurchaseOrder(id);
    await fetchPurchaseOrders();
  };

  return {
    purchaseOrders,
    isLoading,
    error,
    fetchPurchaseOrders,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
  };
}
