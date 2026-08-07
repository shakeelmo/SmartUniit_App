import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, User, Building, FileText, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrencyWithSymbol } from '../../utils/format';

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoice: any) => void;
  customers: any[];
  editInvoice?: any | null;
}

const DEFAULT_INVOICE_CURRENCY = 'SAR';

function normalizeDateInput(value: unknown): string {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().split('T')[0];
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
}

function normalizeLineItems(items: any[] | undefined): InvoiceLineItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    return [{
      id: '1',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    }];
  }

  return items.map((item, index) => ({
    id: String(item?.id ?? index + 1),
    description: String(item?.description ?? ''),
    quantity: Number(item?.quantity ?? 1) || 1,
    unitPrice: Number(item?.unitPrice ?? item?.unit_price ?? 0) || 0,
    total: Number(item?.total ?? 0) || 0,
  }));
}

export function CreateInvoiceModal({ isOpen, onClose, onSubmit, customers, editInvoice }: CreateInvoiceModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    customerId: '',
    projectId: '',
    quotationId: '',
    invoiceNumber: '',
    amount: '',
    currency: DEFAULT_INVOICE_CURRENCY,
    status: 'draft' as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
    paymentStatus: 'unpaid' as 'unpaid' | 'partially_paid' | 'paid' | 'refunded',
    dueDate: '',
    notes: '',
  });

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editInvoice) {
      setFormData({
        customerId: editInvoice.customerId || '',
        projectId: editInvoice.projectId || '',
        quotationId: editInvoice.quotationId || '',
        invoiceNumber: editInvoice.invoiceNumber || '',
        amount: String(editInvoice.amount ?? ''),
        currency: editInvoice.currency || DEFAULT_INVOICE_CURRENCY,
        status: editInvoice.status || 'draft',
        paymentStatus: editInvoice.paymentStatus || 'unpaid',
        dueDate: normalizeDateInput(editInvoice.dueDate),
        notes: editInvoice.notes || '',
      });
      setLineItems(normalizeLineItems(editInvoice.lineItems));
    } else {
      // Generate invoice number for new invoices
      const year = new Date().getFullYear();
      const invoiceNumber = `INV-${year}-${String(Date.now()).slice(-3).padStart(3, '0')}`;
      
      setFormData({
        customerId: '',
        projectId: '',
        quotationId: '',
        invoiceNumber,
        amount: '',
        currency: DEFAULT_INVOICE_CURRENCY,
        status: 'draft',
        paymentStatus: 'unpaid',
        dueDate: '',
        notes: '',
      });
      setLineItems([{
        id: '1',
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
      }]);
    }
    setErrors({});
  }, [editInvoice, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required';
    }

    if (!formData.invoiceNumber.trim()) {
      newErrors.invoiceNumber = 'Invoice number is required';
    }

    if (!formData.amount && lineItems.length === 0) {
      newErrors.amount = 'Amount or line items are required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const totalAmount = lineItems.length > 0 
      ? lineItems.reduce((sum, item) => sum + item.total, 0)
      : parseFloat(formData.amount) || 0;
    
    const invoiceData = {
      ...formData,
      amount: totalAmount,
      dueDate: new Date(formData.dueDate),
      lineItems: lineItems.filter(item => item.description.trim()),
      createdBy: user?.id || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    onSubmit(invoiceData);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLineItemChange = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-calculate total when quantity or unit price changes
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    setLineItems(updatedItems);
  };

  const addLineItem = () => {
    const newItem: InvoiceLineItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + item.total, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-dark-900">
            {editInvoice ? 'Edit Invoice' : 'Create New Invoice'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-dark-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="customerId" className="block text-sm font-medium text-dark-700 mb-2">
                <Building className="w-4 h-4 inline mr-1" />
                Customer *
              </label>
              <select
                id="customerId"
                name="customerId"
                required
                value={formData.customerId}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.customerId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.company || customer.email}
                  </option>
                ))}
              </select>
              {errors.customerId && (
                <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>
              )}
            </div>

            <div>
              <label htmlFor="invoiceNumber" className="block text-sm font-medium text-dark-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Invoice Number *
              </label>
              <input
                type="text"
                id="invoiceNumber"
                name="invoiceNumber"
                required
                value={formData.invoiceNumber}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.invoiceNumber ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter invoice number"
              />
              {errors.invoiceNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.invoiceNumber}</p>
              )}
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-dark-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Due Date *
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                required
                value={formData.dueDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.dueDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
              )}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-dark-700 mb-2">
                Invoice Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label htmlFor="paymentStatus" className="block text-sm font-medium text-dark-700 mb-2">
                Payment Status
              </label>
              <select
                id="paymentStatus"
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="unpaid">Unpaid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-900">Line Items</h3>
              <button
                type="button"
                onClick={addLineItem}
                className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-dark-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter item description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-1">
                        {`Unit Price (${DEFAULT_INVOICE_CURRENCY})`}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleLineItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-end space-x-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-dark-700 mb-1">
                          {`Total (${DEFAULT_INVOICE_CURRENCY})`}
                        </label>
                        <input
                          type="text"
                          value={formatCurrencyWithSymbol(item.total, DEFAULT_INVOICE_CURRENCY)}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        disabled={lineItems.length === 1}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 bg-primary-50 p-4 rounded-lg">
              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span className="text-primary-600">{formatCurrencyWithSymbol(calculateSubtotal(), DEFAULT_INVOICE_CURRENCY)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Amount (if no line items) */}
          {lineItems.every(item => !item.description.trim()) && (
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-dark-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                {`Amount (${DEFAULT_INVOICE_CURRENCY})`}
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.amount ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter invoice amount"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-dark-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Additional notes or payment terms"
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-dark-600 hover:text-dark-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {editInvoice ? 'Update Invoice' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
