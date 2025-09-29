import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calculator } from 'lucide-react';
import { Quote, QuoteLineItem } from '../../types/quotation';
import { Customer } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useQuotations } from '../../hooks/useQuotations';
import { formatCurrency } from '../../utils/format';
import { generateQuotationPDF } from '../../utils/pdfGenerator';
import { SaudiRiyalSymbol } from '../SaudiRiyalSymbol';

interface CreateQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editQuote?: Quote | null;
}

// Using the new Saudi Riyal symbol component
const RiyalSymbol = ({ className = "w-4 h-4" }: { className?: string }) => (
  <SaudiRiyalSymbol className={className} />
);

export function CreateQuoteModal({ isOpen, onClose, onSubmit, editQuote }: CreateQuoteModalProps) {
  const { user } = useAuth();
  const { customers, services, settings } = useQuotations();
  
  // Function to generate unique quotation number: DD-MM-YYYY-HHMM (22 characters)
  const generateQuotationNumber = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${day}-${month}-${year}-${hours}${minutes}`;
  };
  
  const [formData, setFormData] = useState({
    customerId: '',
    status: 'draft' as Quote['status'],
    validUntil: '',
    notes: '',
    notesAr: '',
    scopeOfWork: '',
    scopeOfWorkAr: '',
            terms: 'Payment terms: 30 days from invoice date\nAll prices are in Saudi Riyals (SAR)\nVAT is included in all prices\nDelivery will be made within 7-14 business days',
    termsAr: 'شروط الدفع: 30 يوم من تاريخ الفاتورة\nجميع الأسعار بالريال السعودي\nضريبة القيمة المضافة مشمولة في جميع الأسعار\nسيتم التسليم خلال 7-14 يوم عمل',
    assignedTo: user?.id || '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
  });

  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([{
    id: '1',
    serviceId: '',
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    quantity: 1,
    unitPrice: 0,
    total: 0,
  }]);

  useEffect(() => {
    if (editQuote) {
      setFormData({
        customerId: editQuote.customerId,
        status: editQuote.status,
        validUntil: editQuote.validUntil.toISOString().split('T')[0],
        notes: editQuote.notes || '',
        notesAr: editQuote.notesAr || '',
        scopeOfWork: editQuote.scopeOfWork || '',
        scopeOfWorkAr: editQuote.scopeOfWorkAr || '',
        terms: editQuote.terms || '',
        termsAr: editQuote.termsAr || '',
        assignedTo: editQuote.assignedTo || user?.id || '',
        discountType: editQuote.discountType || 'percentage',
        discountValue: editQuote.discountValue || 0,
      });
      
      // Ensure line items have proper totals calculated
      const updatedLineItems = editQuote.lineItems.map(item => ({
        ...item,
        total: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
      }));
      console.log('Updated line items for editing:', updatedLineItems);
      setLineItems(updatedLineItems);
    } else {
      // Reset form for new quote
      const defaultValidUntil = new Date();
      defaultValidUntil.setDate(defaultValidUntil.getDate() + 30);
      
      setFormData({
        customerId: '',
        status: 'draft',
        validUntil: defaultValidUntil.toISOString().split('T')[0],
        notes: '',
        notesAr: '',
        scopeOfWork: '',
        scopeOfWorkAr: '',
        terms: 'Payment terms: 30 days from invoice date\nAll prices are in Saudi Riyals (SAR)\nVAT is included in all prices\nDelivery will be made within 7-14 business days',
        termsAr: 'شروط الدفع: 30 يوم من تاريخ الفاتورة\nجميع الأسعار بالريال السعودي\nضريبة القيمة المضافة مشمولة في جميع الأسعار\nسيتم التسليم خلال 7-14 يوم عمل',
        assignedTo: user?.id || '',
        discountType: 'percentage',
        discountValue: 0,
      });
      setLineItems([{
        id: '1',
        serviceId: '',
        name: '',
        nameAr: '',
        description: '',
        descriptionAr: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
      }]);
    }
  }, [editQuote, user?.id]);

  const calculateTotals = () => {
    console.log('calculateTotals called with lineItems:', lineItems);
    
    const subtotal = lineItems.reduce((sum, item) => {
      // Calculate total for each line item if it's not set
      let itemTotal = item.total;
      if (!itemTotal || itemTotal === 0) {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        itemTotal = quantity * unitPrice;
        console.log('Recalculated line item total:', { quantity, unitPrice, itemTotal });
      }
      console.log('Line item:', item, 'Total:', itemTotal);
      return sum + itemTotal;
    }, 0);
    
    console.log('Calculated subtotal:', subtotal);
    
    // Calculate discount
    let discountAmount = 0;
    if (formData.discountValue > 0) {
      if (formData.discountType === 'percentage') {
        discountAmount = subtotal * (formData.discountValue / 100);
      } else {
        discountAmount = formData.discountValue;
      }
    }
    
    const vatRate = settings?.vatRate || 15; // Default to 15% if settings is null
    const vatAmount = (subtotal - discountAmount) * (vatRate / 100);
    const total = subtotal - discountAmount + vatAmount;
    
    console.log('Final calculations:', { subtotal, discountAmount, vatAmount, total, vatRate });
    
    return { subtotal, discountAmount, vatAmount, total, vatRate };
  };

  const handleLineItemChange = (index: number, field: keyof QuoteLineItem, value: any) => {
    console.log('handleLineItemChange:', { index, field, value });
    
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-calculate total when quantity or unit price changes
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = Number(updatedItems[index].quantity) || 0;
      const unitPrice = Number(updatedItems[index].unitPrice) || 0;
      const newTotal = quantity * unitPrice;
      console.log('Calculating new total:', quantity, '*', unitPrice, '=', newTotal);
      updatedItems[index].total = newTotal;
    }
    
    // Auto-fill service details when service is selected
    if (field === 'serviceId' && value) {
      const service = services.find(s => s.id === value);
      if (service) {
        const quantity = Number(updatedItems[index].quantity) || 0;
        const unitPrice = Number(service.defaultPrice) || 0;
        const newTotal = quantity * unitPrice;
        
        updatedItems[index] = {
          ...updatedItems[index],
          name: service.name,
          nameAr: service.nameAr,
          description: service.description,
          descriptionAr: service.descriptionAr,
          unitPrice: service.defaultPrice,
          total: newTotal,
        };
        console.log('Updated line item with service:', updatedItems[index]);
      }
    }
    
    console.log('Updated line items:', updatedItems);
    setLineItems(updatedItems);
  };

  const addLineItem = () => {
    const newItem: QuoteLineItem = {
      id: Date.now().toString(),
      serviceId: '',
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Make customer selection optional - allow creating quotations without customer
    if (lineItems.length === 0 || lineItems.every(item => item.quantity <= 0)) {
      alert('Please add at least one valid line item (with quantity > 0).');
      return;
    }

    const { subtotal, discountAmount, vatAmount, total, vatRate } = calculateTotals();
    
    console.log('calculateTotals result:', { subtotal, discountAmount, vatAmount, total, vatRate });

    // Update line items with correct totals before submitting
    const updatedLineItems = lineItems.map(item => ({
      ...item,
      total: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
    }));

    const quoteData: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'> = {
      customerId: formData.customerId,
      status: formData.status,
      lineItems: updatedLineItems,
      subtotal: Number(subtotal) || 0,
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue) || 0,
      discountAmount: Number(discountAmount) || 0,
      vatRate: Number(vatRate) || 0,
      vatAmount: Number(vatAmount) || 0,
      total: Number(total) || 0,
      validUntil: new Date(formData.validUntil),
      notes: formData.notes,
      notesAr: formData.notesAr,
      terms: formData.terms,
      termsAr: formData.termsAr,
      assignedTo: formData.assignedTo,
      quoteNumber: editQuote ? editQuote.quoteNumber : generateQuotationNumber(),
      createdBy: user?.id || '',
    };
    
    console.log('Final quoteData:', quoteData);

    onSubmit(quoteData);
    onClose();
  };

  const handleExportPDF = async () => {
    let customer: Customer | undefined;
    // if (isNewCustomer) { // This block is removed as per the edit hint
    //   customer = {
    //     ...customerData,
    //     id: '',
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    //   };
    // } else {
      customer = customers.find(c => c.id === formData.customerId);
    // }
    if (!customer) {
      alert('Please select or enter a customer before exporting to PDF.');
      return;
    }
    const { subtotal, discountAmount, vatAmount, total, vatRate } = calculateTotals();
    
    // Use actual quote number if editing, otherwise generate new one
    const quoteNumber = editQuote?.quoteNumber || generateQuotationNumber();
    
    const quoteData: Quote = {
      id: editQuote?.id || '',
      quoteNumber: quoteNumber,
      customerId: formData.customerId, // This line is changed as per the edit hint
      customer,
      status: formData.status,
      lineItems,
      subtotal,
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue) || 0,
      discountAmount: Number(discountAmount) || 0,
      vatRate,
      vatAmount,
      total,
      validUntil: new Date(formData.validUntil),
      notes: formData.notes,
      notesAr: formData.notesAr,
      terms: formData.terms,
      termsAr: formData.termsAr,
      assignedTo: formData.assignedTo,
      createdBy: user?.id || '',
      createdAt: editQuote?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    const pdfBlob = await generateQuotationPDF(quoteData, settings || {
      vatRate: 15,
      companyInfo: {
        name: 'Smart Universe Communication and Information Technology',
        nameAr: 'مؤسسة الكون الذكي للاتصالات و تقنية المعلومات',
        address: 'King Abdulaziz Road, Riyadh',
        addressAr: 'طريق الملك عبدالعزيز، الرياض',
        phone: '+966 50 123 4567',
        email: 'info@smartuniit.com',
        crNumber: '1010123456',
        vatNumber: '300155266800003',
        bankingDetails: {
          bankName: 'Saudi National Bank',
          iban: 'SA3610000041000000080109',
          accountNumber: '41000000080109'
        },
      },
    });
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quotation-${quoteData.quoteNumber || quoteData.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const { subtotal, vatAmount, total } = calculateTotals();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-dark-900">
            {editQuote ? 'Edit Quote' : 'Create New Quote'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-dark-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Quotation Number (Auto-generated) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Quotation Number *
              </label>
              <input
                type="text"
                value={editQuote ? editQuote.quoteNumber : generateQuotationNumber()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                readOnly
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-generated: DD-MM-YYYY-HHMM format (22 characters)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Quote['status'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Customer
              </label>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <select
                    value={formData.customerId}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Customer (Optional)</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.company} - {customer.name}
                      </option>
                    ))}
                  </select>
                  <a
                    href="/customers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-primary-600 hover:underline text-sm"
                  >
                    + Add New Customer
                  </a>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Valid Until
              </label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-900">
                Line Items
              </h3>
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
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-dark-700 mb-1">
                        Service
                      </label>
                      <select
                        value={item.serviceId || ''}
                        onChange={(e) => handleLineItemChange(index, 'serviceId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Custom Service</option>
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                      </select>
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
                        Unit
                      </label>
                      <select
                        value={item.unit || 'piece'}
                        onChange={(e) => handleLineItemChange(index, 'unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="piece">Piece</option>
                        <option value="hour">Hour</option>
                        <option value="day">Day</option>
                        <option value="week">Week</option>
                        <option value="month">Month</option>
                        <option value="year">Year</option>
                        <option value="kg">Kilogram (kg)</option>
                        <option value="m">Meter (m)</option>
                        <option value="m2">Square Meter (m²)</option>
                        <option value="m3">Cubic Meter (m³)</option>
                        <option value="liter">Liter (L)</option>
                        <option value="set">Set</option>
                        <option value="package">Package</option>
                        <option value="service">Service</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    {item.unit === 'custom' && (
                      <div>
                        <label className="block text-sm font-medium text-dark-700 mb-1">
                          Custom Unit
                        </label>
                        <input
                          type="text"
                          value={item.customUnit || ''}
                          onChange={(e) => handleLineItemChange(index, 'customUnit', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Enter custom unit"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-1">
                        Unit Price (<RiyalSymbol className="w-3 h-3" />)
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
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-1">
                        Total (<RiyalSymbol className="w-3 h-3" />)
                      </label>
                      <input
                        type="text"
                        value={`${item.total.toLocaleString()}`}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                      />
                    </div>
                    <div className="flex items-end">
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-1">
                        Description (English)
                      </label>
                      <textarea
                        value={item.description}
                        onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        rows={2}
                        placeholder="Service description in English"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-1">
                        Description (Arabic) / الوصف
                      </label>
                      <textarea
                        value={item.descriptionAr || ''}
                        onChange={(e) => handleLineItemChange(index, 'descriptionAr', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        rows={2}
                        placeholder="وصف الخدمة بالعربية"
                        dir="rtl"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discount Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-900">
                Discount
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  Discount Type
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value as 'percentage' | 'fixed' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (<RiyalSymbol className="w-3 h-3" />)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  Discount Value
                </label>
                <input
                  type="number"
                  min="0"
                  step={formData.discountType === 'percentage' ? '0.01' : '0.01'}
                  max={formData.discountType === 'percentage' ? '100' : undefined}
                  value={formData.discountValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={formData.discountType === 'percentage' ? '0.00' : '0.00'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  Discount Amount
                </label>
                <input
                  type="text"
                  value={`${calculateTotals().discountAmount.toLocaleString()}`}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-primary-50 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-900 flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Quote Summary
              </h3>
            </div>
            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span className="text-dark-600">Subtotal:</span>
                <span className="font-semibold flex items-center">
                  <RiyalSymbol className="w-4 h-4 mr-1" />
                  {formatCurrency(subtotal, 'SAR')}
                </span>
              </div>
              {calculateTotals().discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({formData.discountType === 'percentage' ? `${formData.discountValue}%` : 'Fixed'}):</span>
                  <span className="font-semibold flex items-center">
                    -<RiyalSymbol className="w-4 h-4 mr-1" />
                    {formatCurrency(calculateTotals().discountAmount, 'SAR')}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-dark-600">VAT ({settings?.vatRate || 15}%):</span>
                <span className="font-semibold flex items-center">
                  <RiyalSymbol className="w-4 h-4 mr-1" />
                  {formatCurrency(vatAmount, 'SAR')}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold text-primary-600 pt-2 border-t border-primary-200">
                <span>Total:</span>
                <span className="flex items-center">
                  <RiyalSymbol className="w-5 h-5 mr-1" />
                  {formatCurrency(total, 'SAR')}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Notes (English)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
                placeholder="Additional notes or terms"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Notes (Arabic) / ملاحظات
              </label>
              <textarea
                value={formData.notesAr}
                onChange={(e) => setFormData(prev => ({ ...prev, notesAr: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
                placeholder="ملاحظات أو شروط إضافية"
                dir="rtl"
              />
            </div>
          </div>

          {/* Terms & Conditions - Fully Customizable */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-dark-900 mb-3 flex items-center">
              📝 Terms & Conditions - Fully Customizable
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Customize terms for each customer. You can modify payment terms, delivery schedules, warranty conditions, etc.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  Terms & Conditions (English) *
                </label>
                <textarea
                  value={formData.terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={4}
                  placeholder="Payment terms: 30 days from invoice date
All prices are in Saudi Riyals (SAR)
VAT is included in all prices
This quotation is valid for 30 days
Delivery will be made within 7-14 business days
Warranty: 12 months from delivery date"
                />
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500">💡 <strong>Common terms:</strong></p>
                  <p className="text-xs text-gray-500">• Payment: 30/60/90 days</p>
                  <p className="text-xs text-gray-500">• Validity: 15/30/60 days</p>
                  <p className="text-xs text-gray-500">• Delivery: 7-14/15-30 business days</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  Terms & Conditions (Arabic) / الشروط والأحكام *
                </label>
                <textarea
                  value={formData.termsAr}
                  onChange={(e) => setFormData(prev => ({ ...prev, termsAr: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={4}
                  placeholder="شروط الدفع: 30 يوم من تاريخ الفاتورة
جميع الأسعار بالريال السعودي
ضريبة القيمة المضافة مشمولة في جميع الأسعار
هذا العرض صالح لمدة 30 يوم
سيتم التسليم خلال 7-14 يوم عمل
الضمان: 12 شهر من تاريخ التسليم"
                  dir="rtl"
                />
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500">💡 <strong>نصائح:</strong></p>
                  <p className="text-xs text-gray-500">• الدفع: 30/60/90 يوم</p>
                  <p className="text-xs text-gray-500">• الصلاحية: 15/30/60 يوم</p>
                  <p className="text-xs text-gray-500">• التسليم: 7-14/15-30 يوم عمل</p>
                </div>
              </div>
            </div>
          </div>

          {/* Scope of Work - Fully Customizable */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-dark-900 mb-3 flex items-center">
              🔧 Scope of Work - Fully Customizable
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Define the scope of work for this project. You can detail deliverables, milestones, exclusions, etc.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  Scope of Work (English)
                </label>
                <textarea
                  value={formData.scopeOfWork}
                  onChange={(e) => setFormData(prev => ({ ...prev, scopeOfWork: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={4}
                  placeholder="Project deliverables:
• System installation and configuration
• User training and documentation
• 3 months post-implementation support

Exclusions:
• Hardware procurement
• Third-party software licenses
• Ongoing maintenance after warranty period

Timeline: 4-6 weeks from project approval"
                />
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500">💡 <strong>Common scope items:</strong></p>
                  <p className="text-xs text-gray-500">• Deliverables & milestones</p>
                  <p className="text-xs text-gray-500">• Exclusions & limitations</p>
                  <p className="text-xs text-gray-500">• Timeline & dependencies</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  Scope of Work (Arabic) / نطاق العمل
                </label>
                <textarea
                  value={formData.scopeOfWorkAr}
                  onChange={(e) => setFormData(prev => ({ ...prev, scopeOfWorkAr: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={4}
                  placeholder="مخرجات المشروع:
• تثبيت وتكوين النظام
• تدريب المستخدمين والتوثيق
• دعم لمدة 3 أشهر بعد التنفيذ

الاستثناءات:
• شراء الأجهزة
• تراخيص البرامج الخارجية
• الصيانة المستمرة بعد فترة الضمان

الجدول الزمني: 4-6 أسابيع من موافقة المشروع"
                  dir="rtl"
                />
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500">💡 <strong>نصائح:</strong></p>
                  <p className="text-xs text-gray-500">• المخرجات والمراحل</p>
                  <p className="text-xs text-gray-500">• الاستثناءات والقيود</p>
                  <p className="text-xs text-gray-500">• الجدول الزمني والتبعيات</p>
                </div>
              </div>
            </div>
          </div>

          {/* Banking Details Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-dark-900 mb-2">
              Banking Details (Permanent)
            </h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Company:</strong> Smart Universe Communication and Information Technology</p>
              <p><strong>Bank:</strong> Saudi National Bank</p>
              <p><strong>IBAN:</strong> SA3610000041000000080109</p>
              <p><strong>Account:</strong> 41000000080109</p>
              <p><strong>VAT:</strong> 300155266800003</p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              type="button"
              className="bg-gray-200 hover:bg-gray-300 text-dark-900 px-4 py-2 rounded-lg transition-colors"
              onClick={handleExportPDF}
            >
              Export to PDF
            </button>
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              className="ml-2 text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}