import React, { useState } from 'react';
import { Plus, Search, Filter, FileText, Users, TrendingUp, Clock } from 'lucide-react';
import { QuoteCard } from '../components/Quotations/QuoteCard';
import { CreateQuoteModal } from '../components/Quotations/CreateQuoteModal';
import QuotePDFPreview from '../components/Quotations/QuotePDFPreview';
import { useQuotations } from '../hooks/useQuotations';
import { Quote } from '../types/quotation';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const RiyalSymbol = ({ className = "w-4 h-4" }: { className?: string }) => (
  <img 
    src="/Riyal_symbol.svg" 
    alt="SAR" 
    className={`inline-block ${className}`}
    style={{ background: 'transparent' }}
  />
);

export function Quotations() {
  const { quotes, customers, addQuote, updateQuote, duplicateQuote, deleteQuote, isLoading } = useQuotations();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);

  const filteredQuotes = quotes.filter(quote => {
    const customer = customers.find(c => String(c.id) === String(quote.customerId));
    const matchesSearch = (quote.quoteNumber || quote.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (customer?.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateQuote = async (quoteData: any) => {
    try {
      if (editingQuote) {
        await updateQuote(editingQuote.id, quoteData);
        toast.success('Quotation updated successfully');
        setEditingQuote(null);
      } else {
        await addQuote(quoteData);
        toast.success('Quotation created successfully');
      }
      setIsCreateModalOpen(false);
    } catch (error) {
      toast.error('Failed to save quote. Please try again.');
      console.error('Error saving quote:', error);
    }
  };

  const handleEditQuote = (quote: Quote) => {
    setEditingQuote(quote);
    setIsCreateModalOpen(true);
  };

  const handleDuplicateQuote = (quoteId: string) => {
    duplicateQuote(quoteId);
  };

  const handleViewPDF = (quote: Quote) => {
    setPreviewQuote(quote);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingQuote(null);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Quotations', 14, 16);
    const tableColumn = ['Quote Number', 'Customer', 'Status', 'Total', 'Valid Until'];
    const tableRows = filteredQuotes.map(quote => {
      const customer = customers.find(c => c.id === quote.customerId);
      return [
        quote.quoteNumber || quote.id,
        customer?.company || '',
        quote.status,
        quote.total,
        quote.validUntil.toLocaleDateString(),
      ];
    });
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 22 });
    doc.save('quotations.pdf');
  };

  const stats = {
    total: quotes.length,
    draft: quotes.filter(q => q.status === 'draft').length,
    sent: quotes.filter(q => q.status === 'sent').length,
    approved: quotes.filter(q => q.status === 'approved').length,
    rejected: quotes.filter(q => q.status === 'rejected').length,
    totalValue: quotes.reduce((sum, q) => sum + q.total, 0),
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Quotations / عروض الأسعار</h1>
          <p className="text-dark-600">Manage and track all your quotations</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleExportPDF}
            className="bg-gray-200 hover:bg-gray-300 text-dark-900 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <span>Export to PDF</span>
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Quote</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-600">Total Quotes</p>
              <p className="text-2xl font-bold text-dark-900">{stats.total}</p>
            </div>
            <div className="p-2 bg-primary-100 rounded-lg">
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-600">Draft</p>
              <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Clock className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-600">Sent</p>
              <p className="text-2xl font-bold text-blue-600">{stats.sent}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-600">Total Value</p>
              <p className="text-lg font-bold text-primary-600 flex items-center">
                <RiyalSymbol className="w-4 h-4 mr-1" />
                {stats.totalValue.toLocaleString()}
              </p>
            </div>
            <div className="p-2 bg-primary-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search quotes, customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-dark-600" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Quotes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuotes.map((quote) => {
          const customer = customers.find(c => String(c.id) === String(quote.customerId));
          return (
            <QuoteCard
              key={quote.id}
              quote={quote}
              customer={customer}
              onEdit={handleEditQuote}
              onDuplicate={handleDuplicateQuote}
              onDelete={deleteQuote}
              onViewPDF={handleViewPDF}
            />
          );
        })}
      </div>

      {filteredQuotes.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-dark-900 mb-2">No quotes found</h3>
          <p className="text-dark-600 mb-4">Get started by creating your first quotation</p>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Create Quote
          </button>
        </div>
      )}

      {/* Create/Edit Quote Modal */}
      <CreateQuoteModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateQuote}
        editQuote={editingQuote}
      />

      {/* PDF Preview Modal */}
      {previewQuote && (
        <QuotePDFPreview
          quote={previewQuote}
          customer={customers.find(c => c.id === previewQuote.customerId)!}
          onClose={() => setPreviewQuote(null)}
        />
      )}
    </div>
  );
}
