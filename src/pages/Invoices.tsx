import React, { useState } from 'react';
import { Plus, Search, Filter, Receipt, DollarSign, Calendar, AlertCircle, Download, Edit, Trash2 } from 'lucide-react';
import { CreateInvoiceModal } from '../components/Invoices/CreateInvoiceModal';
import { useInvoices } from '../hooks/useInvoices';
import { useCustomers } from '../hooks/useCustomers';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { generateInvoicePDF } from '../utils/invoicePdf';
import toast from 'react-hot-toast';
import { formatCurrencyWithSymbol } from '../utils/format';

const toLowerSafe = (value: unknown) => String(value ?? '').toLowerCase();

const mapInvoiceDetails = (invoice: any) => ({
  id: invoice.id,
  customerId: invoice.customer_id,
  projectId: invoice.project_id,
  quotationId: invoice.quotation_id,
  invoiceNumber: invoice.invoice_number || '',
  amount: Number(invoice.amount || 0),
  currency: invoice.currency || 'SAR',
  status: invoice.status || 'draft',
  paymentStatus: invoice.payment_status || 'unpaid',
  dueDate: invoice.due_date ? new Date(invoice.due_date) : null,
  paidDate: invoice.paid_date ? new Date(invoice.paid_date) : null,
  notes: invoice.notes || '',
  createdAt: invoice.created_at ? new Date(invoice.created_at) : new Date(),
  lineItems: (invoice.lineItems || []).map((item: any) => ({
    id: item.id,
    description: item.description || '',
    quantity: Number(item.quantity || 0),
    unitPrice: Number(item.unit_price || 0),
    total: Number(item.total || 0),
  })),
});

export function Invoices() {
  const { user, hasPermission } = useAuth();
  const { invoices, isLoading: invoicesLoading, addInvoice, updateInvoice, deleteInvoice } = useInvoices();
  const { customers, isLoading: customersLoading } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const isLoading = invoicesLoading || customersLoading;

  const filteredInvoices = invoices.filter(invoice => {
    const customer = customers.find(c => c.id === invoice.customerId);
    const loweredSearch = toLowerSafe(searchTerm);
    const matchesSearch = toLowerSafe(invoice.invoiceNumber).includes(loweredSearch) ||
                         toLowerSafe(customer?.name).includes(loweredSearch) ||
                         toLowerSafe(customer?.company).includes(loweredSearch);
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };
  const paymentStatusColors = {
    unpaid: 'bg-red-100 text-red-800',
    partially_paid: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    refunded: 'bg-purple-100 text-purple-800',
  };

  const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  const paidAmount = invoices.filter(inv => inv.paymentStatus === 'paid').reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  const pendingAmount = invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  const overdueAmount = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

  const handleCreateInvoice = async (invoiceData: any) => {
    try {
      if (editingInvoice) {
        await updateInvoice(editingInvoice.id, invoiceData);
        toast.success('Invoice updated successfully');
        setEditingInvoice(null);
      } else {
        await addInvoice(invoiceData);
        toast.success('Invoice created successfully');
      }
    } catch (error) {
      toast.error(editingInvoice ? 'Failed to update invoice' : 'Failed to create invoice');
      console.error('Error managing invoice:', error);
    }
  };

  const handleEditInvoice = async (invoice: any) => {
    try {
      const response = await api.getInvoice(invoice.id);
      setEditingInvoice(mapInvoiceDetails(response.invoice));
      setIsCreateModalOpen(true);
    } catch (error) {
      console.error('Error loading invoice details:', error);
      toast.error('Failed to load invoice details');
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      try {
        await deleteInvoice(invoiceId);
        toast.success('Invoice deleted successfully');
      } catch (error) {
        toast.error('Failed to delete invoice');
        console.error('Error deleting invoice:', error);
      }
    }
  };

  const handleExportPDF = async (invoice: any) => {
    try {
      setIsExporting(invoice.id);
      const response = await api.getInvoice(invoice.id);
      const fullInvoice = response.invoice ? mapInvoiceDetails(response.invoice) : invoice;

      const customer = customers.find(c => c.id === fullInvoice.customerId) || { 
        name: 'Unknown Customer', 
        email: 'customer@example.com', 
        phone: '+966 550188288',
        address: 'Customer Address'
      };

      const blob = await generateInvoicePDF(fullInvoice, customer);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${fullInvoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Invoice PDF download started');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Error generating PDF. Please try again.');
    } finally {
      setIsExporting(null);
    }
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingInvoice(null);
  };

  const canManageInvoices = hasPermission('invoices', 'create');

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
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Invoices</h1>
          <p className="text-dark-600">Manage invoices and track payments</p>
        </div>
        {canManageInvoices && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-600">Total Amount</p>
              <p className="text-2xl font-bold text-dark-900">{formatCurrencyWithSymbol(totalAmount, 'SAR')}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-600">Paid</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrencyWithSymbol(paidAmount, 'SAR')}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Receipt className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrencyWithSymbol(pendingAmount, 'SAR')}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Receipt className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrencyWithSymbol(overdueAmount, 'SAR')}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
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
              placeholder="Search invoices..."
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
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => {
                const customer = customers.find(c => c.id === invoice.customerId);
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-dark-900">{invoice.invoiceNumber}</div>
                        <div className="text-sm text-dark-500">
                          Created {invoice.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-dark-900">{customer?.name || 'Unknown Customer'}</div>
                      <div className="text-sm text-dark-500">{customer?.company || customer?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-dark-900">
                        {formatCurrencyWithSymbol(invoice.amount, invoice.currency || 'SAR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status as keyof typeof statusColors]}`}>
                          {invoice.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColors[invoice.paymentStatus as keyof typeof paymentStatusColors] || paymentStatusColors.unpaid}`}>
                          Payment: {String(invoice.paymentStatus || 'unpaid').replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-dark-900">
                        {invoice.dueDate.toLocaleDateString()}
                      </div>
                      {invoice.status === 'overdue' && (
                        <div className="text-xs text-red-600">
                          {Math.ceil((Date.now() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24))} days overdue
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleExportPDF(invoice)}
                          disabled={isExporting === invoice.id}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isExporting === invoice.id ? (
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          <span>PDF</span>
                        </button>
                        {canManageInvoices && (
                          <>
                            <button 
                              onClick={() => handleEditInvoice(invoice)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteInvoice(invoice.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-dark-900 mb-2">No invoices found</h3>
          <p className="text-dark-600 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating your first invoice'
            }
          </p>
          {canManageInvoices && !searchTerm && statusFilter === 'all' && (
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Create Invoice
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Invoice Modal */}
      <CreateInvoiceModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateInvoice}
        customers={customers}
        editInvoice={editingInvoice}
      />
    </div>
  );
}
