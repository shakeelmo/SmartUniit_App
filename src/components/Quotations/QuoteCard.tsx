import React, { useState } from 'react';
import { Edit, Copy, Eye, Download, Calendar, FileText, User, Trash2 } from 'lucide-react';
import { Quote } from '../../types/quotation';
import { Customer } from '../../types';
import { useQuotations } from '../../hooks/useQuotations';
import { formatCurrency } from '../../utils/format';
import { generateQuotationPDF } from '../../utils/pdfGenerator';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { SaudiRiyalSymbol } from '../SaudiRiyalSymbol';

// Helper function to safely format dates
const formatDate = (dateValue: any): string => {
  try {
    if (!dateValue) return 'N/A';
    
    let date: Date;
    if (typeof dateValue === 'string') {
      date = parseISO(dateValue);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      return 'N/A';
    }
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

// Helper function to safely format short dates
const formatShortDate = (dateValue: any): string => {
  try {
    if (!dateValue) return 'N/A';
    
    let date: Date;
    if (typeof dateValue === 'string') {
      date = parseISO(dateValue);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      return 'N/A';
    }
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return format(date, 'MMM dd');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

interface QuoteCardProps {
  quote: Quote;
  customer?: any;
  onEdit: (quote: Quote) => void;
  onDuplicate: (quoteId: string) => void;
  onViewPDF: (quote: Quote) => void;
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const statusLabels = {
  draft: 'Draft',
  sent: 'Sent',
  approved: 'Approved',
  rejected: 'Rejected',
};

// Using the new Saudi Riyal symbol component
const RiyalSymbol = ({ className = "w-4 h-4" }: { className?: string }) => (
  <SaudiRiyalSymbol className={className} />
);

export function QuoteCard({ quote, customer, onEdit, onDuplicate, onViewPDF }: QuoteCardProps) {
  const { settings, customers, deleteQuote } = useQuotations();
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customCustomer, setCustomCustomer] = useState<Partial<Customer>>({});
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDownloadPDF = async () => {
    let exportCustomer = customer;
    
    // If customer prop is not available, try to find it using quote.customerId
    if (!exportCustomer && quote.customerId) {
      exportCustomer = customers.find(c => String(c.id) === String(quote.customerId));
    }
    
    if (!exportCustomer) {
      // If no customer is found, use a default customer for PDF export
      exportCustomer = {
        id: 'default',
        name: 'Walk-in Customer',
        company: 'General Customer',
        email: 'customer@example.com',
        phone: '',
        address: '',
        status: 'active' as const,
        createdBy: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    try {
      setIsDownloading(true);
      console.info('[quotation:download_pdf:click]', { quoteId: quote.id, quoteNumber: quote.quoteNumber });
      const quoteWithCustomer = { ...quote, customer: exportCustomer };
      const pdfBlob = await generateQuotationPDF(quoteWithCustomer, settings);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quotation-${quote.quoteNumber || quote.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.info('[quotation:download_pdf:success]', { quoteId: quote.id });
      toast.success('Quotation PDF download started');
    } catch (error) {
      console.error('[quotation:download_pdf:error]', error);
      toast.error('Error generating PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteQuote = async () => {
    if (!confirm('Are you sure you want to delete this quotation? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      await deleteQuote(quote.id);
    } catch (error) {
      console.error('Error deleting quotation:', error);
      alert('Error deleting quotation. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCustomerSelectExport = async () => {
    let exportCustomer: Customer | undefined;
    if (selectedCustomerId) {
      exportCustomer = customers.find(c => c.id === selectedCustomerId);
    } else if (customCustomer.company && customCustomer.name && customCustomer.email) {
      exportCustomer = {
        id: '',
        name: customCustomer.name,
        email: customCustomer.email,
        phone: customCustomer.phone || '',
        company: customCustomer.company,
        address: customCustomer.address || '',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: '',
      };
    }
    if (!exportCustomer) {
      alert('Please select or enter customer details.');
      return;
    }
    setShowCustomerSelect(false);
    setIsDownloading(true);
    try {
      const quoteWithCustomer = { ...quote, customer: exportCustomer };
      const pdfBlob = await generateQuotationPDF(quoteWithCustomer, settings);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quotation-${quote.quoteNumber || quote.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const validUntilDate = quote.validUntil ? new Date(quote.validUntil) : null;
  const validUntilStr = validUntilDate && !isNaN(validUntilDate.getTime()) ? validUntilDate.toLocaleDateString() : '';

  const canDelete = user?.role === 'superadmin' || user?.role === 'admin';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-dark-900">
              {quote.quoteNumber || `Quote-${quote.id}`}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[quote.status]}`}>
              {statusLabels[quote.status]}
            </span>
          </div>
          <p className="text-dark-600 text-sm">
            {customer?.company || 'No customer selected'}
          </p>
          <p className="text-dark-500 text-xs">
            {customer?.name || ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary-600 flex items-center justify-end">
            <RiyalSymbol className="w-6 h-6 mr-1" />
            {formatCurrency(quote.total, 'SAR')}
          </p>
          <p className="text-xs text-dark-500 flex items-center justify-end">
            VAT: <RiyalSymbol className="w-3 h-3 mx-1" />
            {formatCurrency(quote.vatAmount, 'SAR')}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-dark-600">
            <Calendar className="w-4 h-4 mr-1" />
            Created: {formatDate(quote.createdAt)}
          </div>
          <div className="flex items-center text-dark-600">
            <Calendar className="w-4 h-4 mr-1" />
            Valid until: {formatDate(quote.validUntil)}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-dark-600">
            <FileText className="w-4 h-4 mr-1" />
            {quote.lineItems && quote.lineItems.length > 0 ? `${quote.lineItems.length} item${quote.lineItems.length !== 1 ? 's' : ''}` : '0 items'}
          </div>
          {quote.assignedTo && (
            <div className="flex items-center text-dark-600">
              <User className="w-4 h-4 mr-1" />
              Assigned
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(quote)}
              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Edit Quote"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDuplicate(quote.id)}
              className="p-2 text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors"
              title="Duplicate Quote"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewPDF(quote)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Preview PDF"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download PDF"
            >
              <Download className={`w-4 h-4 ${isDownloading ? 'animate-spin' : ''}`} />
            </button>
            {canDelete && (
              <button
                onClick={handleDeleteQuote}
                disabled={isDeleting}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete Quote"
              >
                <Trash2 className={`w-4 h-4 ${isDeleting ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
          <div className="text-xs text-dark-500">
            Updated: {formatShortDate(quote.updatedAt)}
          </div>
        </div>
      </div>
      {showCustomerSelect && (
        <div className="mt-2 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <div className="mb-2 text-sm text-yellow-800">Customer information not found. Please select or enter customer details to export PDF:</div>
          <div className="mb-2">
            <select
              value={selectedCustomerId}
              onChange={e => {
                setSelectedCustomerId(e.target.value);
                if (e.target.value) {
                  const c = customers.find(cu => cu.id === e.target.value);
                  setCustomCustomer(c ? { ...c } : {});
                } else {
                  setCustomCustomer({});
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg mr-2"
            >
              <option value="">Select Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.company} - {c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
            <input
              type="text"
              placeholder="Company Name"
              value={customCustomer.company || ''}
              onChange={e => setCustomCustomer(prev => ({ ...prev, company: e.target.value }))}
              className="px-2 py-1 border border-gray-300 rounded"
            />
            <input
              type="text"
              placeholder="Contact Name"
              value={customCustomer.name || ''}
              onChange={e => setCustomCustomer(prev => ({ ...prev, name: e.target.value }))}
              className="px-2 py-1 border border-gray-300 rounded"
            />
            <input
              type="email"
              placeholder="Email"
              value={customCustomer.email || ''}
              onChange={e => setCustomCustomer(prev => ({ ...prev, email: e.target.value }))}
              className="px-2 py-1 border border-gray-300 rounded"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={customCustomer.phone || ''}
              onChange={e => setCustomCustomer(prev => ({ ...prev, phone: e.target.value }))}
              className="px-2 py-1 border border-gray-300 rounded"
            />
            <input
              type="text"
              placeholder="Address"
              value={customCustomer.address || ''}
              onChange={e => setCustomCustomer(prev => ({ ...prev, address: e.target.value }))}
              className="px-2 py-1 border border-gray-300 rounded"
            />
          </div>
          <button
            onClick={handleCustomerSelectExport}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg ml-2"
          >
            Export PDF
          </button>
          <button
            onClick={() => setShowCustomerSelect(false)}
            className="ml-2 text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}