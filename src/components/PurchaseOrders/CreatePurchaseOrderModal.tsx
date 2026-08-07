import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Calendar, FileText, Mail, MapPin, Phone, Plus, Trash2, X } from 'lucide-react';
import { Customer, Vendor } from '../../types';
import { PurchaseOrder } from '../../types/purchaseOrder';

interface CreatePurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean | void> | boolean | void;
  vendors: Vendor[];
  customers: Customer[];
  editPurchaseOrder?: PurchaseOrder | null;
}

interface FormLineItem {
  id: string;
  itemCode: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

const makeLineItem = (): FormLineItem => ({
  id: `${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
  itemCode: '',
  description: '',
  quantity: 1,
  unit: 'pcs',
  unitPrice: 0,
  total: 0,
});

export function CreatePurchaseOrderModal({
  isOpen,
  onClose,
  onSubmit,
  vendors,
  customers,
  editPurchaseOrder,
}: CreatePurchaseOrderModalProps) {
  const [formData, setFormData] = useState({
    poNumber: '',
    direction: 'issued' as 'issued' | 'received',
    vendorId: '',
    customerId: '',
    status: 'draft' as PurchaseOrder['status'],
    poDate: '',
    referenceNumber: '',
    quotationReference: '',
    currency: 'SAR',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    deliveryAddress: '',
    paymentTerms: '',
    notes: '',
    companyContactName: 'Mohammed Omer Sadiq',
    companyContactPhone: '+966 50 990 2054',
    companyContactEmail: 'info@smartuniit.com',
  });
  const [lineItems, setLineItems] = useState<FormLineItem[]>([makeLineItem()]);

  useEffect(() => {
    if (!isOpen) return;

    if (editPurchaseOrder) {
      setFormData({
        poNumber: editPurchaseOrder.poNumber,
        direction: editPurchaseOrder.direction,
        vendorId: editPurchaseOrder.vendorId || '',
        customerId: editPurchaseOrder.customerId || '',
        status: editPurchaseOrder.status,
        poDate: editPurchaseOrder.poDate.toISOString().split('T')[0],
        referenceNumber: editPurchaseOrder.referenceNumber || '',
        quotationReference: editPurchaseOrder.quotationReference || '',
        currency: editPurchaseOrder.currency || 'SAR',
        discountType: editPurchaseOrder.discountType || 'percentage',
        discountValue: editPurchaseOrder.discountValue || 0,
        deliveryAddress: editPurchaseOrder.deliveryAddress || '',
        paymentTerms: editPurchaseOrder.paymentTerms || '',
        notes: editPurchaseOrder.notes || '',
        companyContactName: editPurchaseOrder.companyContactName || 'Mohammed Omer Sadiq',
        companyContactPhone: editPurchaseOrder.companyContactPhone || '+966 50 990 2054',
        companyContactEmail: editPurchaseOrder.companyContactEmail || 'info@smartuniit.com',
      });
      setLineItems(
        editPurchaseOrder.lineItems.length > 0
          ? editPurchaseOrder.lineItems.map((item) => ({
              id: item.id,
              itemCode: item.itemCode || '',
              description: item.description,
              quantity: item.quantity,
              unit: item.unit || 'pcs',
              unitPrice: item.unitPrice,
              total: item.total,
            }))
          : [makeLineItem()]
      );
      return;
    }

    const generatedNumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    setFormData({
      poNumber: generatedNumber,
      direction: 'issued',
      vendorId: '',
      customerId: '',
      status: 'draft',
      poDate: new Date().toISOString().split('T')[0],
      referenceNumber: '',
      quotationReference: '',
      currency: 'SAR',
      discountType: 'percentage',
      discountValue: 0,
      deliveryAddress: '',
      paymentTerms: '',
      notes: '',
      companyContactName: 'Mohammed Omer Sadiq',
      companyContactPhone: '+966 50 990 2054',
      companyContactEmail: 'info@smartuniit.com',
    });
    setLineItems([makeLineItem()]);
  }, [editPurchaseOrder, isOpen]);

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const requestedDiscount = formData.discountType === 'percentage'
      ? subtotal * Math.min(Math.max(formData.discountValue, 0), 100) / 100
      : Math.max(formData.discountValue, 0);
    const discountAmount = Math.min(requestedDiscount, subtotal);
    const netSubtotal = Math.max(subtotal - discountAmount, 0);
    const vatRate = 15;
    const vatAmount = netSubtotal * vatRate / 100;
    return {
      subtotal,
      discountAmount,
      netSubtotal,
      vatRate,
      vatAmount,
      total: netSubtotal + vatAmount,
    };
  }, [formData.discountType, formData.discountValue, lineItems]);

  const updateLineItem = (index: number, field: keyof FormLineItem, value: string | number) => {
    setLineItems((prev) => {
      const next = [...prev];
      const current = { ...next[index], [field]: value };
      current.quantity = Number(current.quantity) || 0;
      current.unitPrice = Number(current.unitPrice) || 0;
      current.total = current.quantity * current.unitPrice;
      next[index] = current;
      return next;
    });
  };

  const addLineItem = () => setLineItems((prev) => [...prev, makeLineItem()]);
  const removeLineItem = (index: number) => {
    setLineItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      po_number: formData.poNumber,
      direction: formData.direction,
      vendor_id: formData.vendorId || null,
      customer_id: formData.customerId || null,
      status: formData.status,
      po_date: formData.poDate,
      reference_number: formData.referenceNumber,
      quotation_reference: formData.quotationReference,
      currency: formData.currency,
      delivery_address: formData.deliveryAddress,
      payment_terms: formData.paymentTerms,
      notes: formData.notes,
      company_contact_name: formData.companyContactName,
      company_contact_phone: formData.companyContactPhone,
      company_contact_email: formData.companyContactEmail,
      subtotal: totals.subtotal,
      discount_type: formData.discountType,
      discount_value: formData.discountValue,
      discount_amount: totals.discountAmount,
      vat_rate: totals.vatRate,
      vat_amount: totals.vatAmount,
      total: totals.total,
      lineItems: lineItems
        .filter((item) => item.description.trim())
        .map((item) => ({
          item_code: item.itemCode,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unitPrice,
          total_price: item.total,
        })),
    };

    const result = await onSubmit(payload);
    if (result !== false) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[95vh] w-full max-w-6xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="text-xl font-semibold text-dark-900">
              {editPurchaseOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}
            </h2>
            <p className="text-sm text-dark-600">Build outgoing vendor POs or track customer-issued POs.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100">
            <X className="h-5 w-5 text-dark-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark-700">
                <FileText className="mr-1 inline h-4 w-4" />
                PO Number
              </label>
              <input
                value={formData.poNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, poNumber: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-dark-700">Direction</label>
              <select
                value={formData.direction}
                onChange={(e) => setFormData((prev) => ({ ...prev, direction: e.target.value as 'issued' | 'received' }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
              >
                <option value="issued">Issued to Vendor</option>
                <option value="received">Received from Customer</option>
              </select>
              <p className="mt-2 text-xs text-dark-500">
                {formData.direction === 'issued'
                  ? 'Use this when Smart Uniit sends a PO to a vendor for procurement or services.'
                  : 'Use this when a customer issues a PO to Smart Uniit and you want to track it internally.'}
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-dark-700">
                <Calendar className="mr-1 inline h-4 w-4" />
                PO Date
              </label>
              <input
                type="date"
                value={formData.poDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, poDate: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark-700">
                <Building2 className="mr-1 inline h-4 w-4" />
                {formData.direction === 'issued' ? 'Vendor' : 'Vendor (Optional)'}
              </label>
              <select
                value={formData.vendorId}
                onChange={(e) => setFormData((prev) => ({ ...prev, vendorId: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-dark-700">
                <Building2 className="mr-1 inline h-4 w-4" />
                {formData.direction === 'received' ? 'Customer' : 'Customer / Buyer'}
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData((prev) => ({ ...prev, customerId: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.company || customer.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as PurchaseOrder['status'] }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
              >
                <option value="draft">Draft</option>
                <option value="issued">Issued</option>
                <option value="received">Received</option>
                <option value="approved">Approved</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-dark-700">Reference Number</label>
              <input
                value={formData.referenceNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, referenceNumber: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-dark-700">Quotation Reference</label>
              <input
                value={formData.quotationReference}
                onChange={(e) => setFormData((prev) => ({ ...prev, quotationReference: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-dark-900">PO Line Items</h3>
              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center space-x-2 rounded-lg bg-primary-600 px-3 py-2 text-white transition-colors hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-dark-700">Item Code</label>
                      <input
                        value={item.itemCode}
                        onChange={(e) => updateLineItem(index, 'itemCode', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="mb-1 block text-sm font-medium text-dark-700">Description</label>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        required
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="mb-1 block text-sm font-medium text-dark-700">Qty</label>
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="mb-1 block text-sm font-medium text-dark-700">Unit</label>
                      <input
                        value={item.unit}
                        onChange={(e) => updateLineItem(index, 'unit', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-dark-700">Unit Price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(index, 'unitPrice', Number(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="mb-1 block text-sm font-medium text-dark-700">Total</label>
                      <input
                        value={item.total.toFixed(2)}
                        readOnly
                        className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2"
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end justify-end">
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark-700">
                  <MapPin className="mr-1 inline h-4 w-4" />
                  Delivery Address
                </label>
                <textarea
                  rows={3}
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData((prev) => ({ ...prev, deliveryAddress: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-dark-700">Payment Terms</label>
                <textarea
                  rows={3}
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData((prev) => ({ ...prev, paymentTerms: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-dark-700">Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <h3 className="mb-4 text-lg font-semibold text-dark-900">Special Discount</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-dark-700">Discount Type</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData((prev) => ({ ...prev, discountType: e.target.value as 'percentage' | 'fixed' }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (SAR)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-dark-700">Discount Value</label>
                    <input
                      type="number"
                      min="0"
                      max={formData.discountType === 'percentage' ? 100 : undefined}
                      step="any"
                      value={formData.discountValue}
                      onChange={(e) => setFormData((prev) => ({ ...prev, discountValue: Number(e.target.value) || 0 }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>
                <div className="mt-3 space-y-1 border-t border-amber-200 pt-3 text-sm font-semibold text-amber-900">
                  <div className="flex items-center justify-between">
                    <span>Applied Special Discount</span>
                    <span>{totals.discountAmount.toFixed(2)} SAR</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium text-amber-800">
                    <span>Equivalent Percentage</span>
                    <span>{totals.subtotal > 0 ? ((totals.discountAmount / totals.subtotal) * 100).toFixed(4) : '0.0000'}%</span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="mb-4 text-lg font-semibold text-dark-900">Smart Uniit Contact</h3>
              <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-dark-700">Contact Name</label>
                    <input
                      value={formData.companyContactName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, companyContactName: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-dark-700">
                      <Phone className="mr-1 inline h-4 w-4" />
                      Phone
                    </label>
                    <input
                      value={formData.companyContactPhone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, companyContactPhone: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-dark-700">
                      <Mail className="mr-1 inline h-4 w-4" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.companyContactEmail}
                      onChange={(e) => setFormData((prev) => ({ ...prev, companyContactEmail: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>
              </div>
            </div>

            <div className="rounded-xl border border-primary-100 bg-primary-50 p-4">
              <h3 className="mb-3 text-lg font-semibold text-primary-900">Totals</h3>
                <div className="space-y-2 text-sm text-dark-700">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span>{totals.subtotal.toFixed(2)} SAR</span>
                  </div>
                  {totals.discountAmount > 0 && (
                    <>
                      <div className="flex items-center justify-between font-semibold text-green-700">
                        <span>Special Discount</span>
                        <span>-{totals.discountAmount.toFixed(2)} SAR</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Net Before VAT</span>
                        <span>{totals.netSubtotal.toFixed(2)} SAR</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between">
                    <span>VAT (15%)</span>
                    <span>{totals.vatAmount.toFixed(2)} SAR</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-primary-200 pt-2 text-base font-semibold text-primary-900">
                    <span>Total</span>
                    <span>{totals.total.toFixed(2)} SAR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-dark-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-primary-600 px-5 py-2 text-white hover:bg-primary-700">
              {editPurchaseOrder ? 'Update Purchase Order' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
