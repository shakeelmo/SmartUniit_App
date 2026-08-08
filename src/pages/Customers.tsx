import React, { useState } from 'react';
import { Plus, Search, Filter, UserCheck, Phone, Mail, Building, MoreHorizontal, Edit, Trash2, Download } from 'lucide-react';
import { useCustomers } from '../hooks/useCustomers';
import { CreateCustomerModal } from '../components/Customers/CreateCustomerModal';
import { useAuth } from '../contexts/AuthContext';
import { Customer } from '../types';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

export function Customers() {
  const { hasPermission, user } = useAuth();
  const { customers, isLoading, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Debug user and permissions
  console.log('Current user:', user);
  console.log('User role:', user?.role);
  console.log('Is superadmin:', user?.role === 'superadmin');

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, customerData);
        toast.success('Customer updated successfully');
        setEditingCustomer(null);
      } else {
        await addCustomer(customerData);
        toast.success('Customer created successfully');
      }
    } catch (error: any) {
      toast.error(error?.message || (editingCustomer ? 'Failed to update customer' : 'Failed to create customer'));
      console.error('Error managing customer:', error);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsCreateModalOpen(true);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        await deleteCustomer(customerId);
        toast.success('Customer deleted successfully');
      } catch (error) {
        toast.error('Failed to delete customer');
        console.error('Error deleting customer:', error);
      }
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await api.exportCustomers();
      toast.success('Customer data exported successfully');
    } catch (error) {
      console.error('Error exporting customers:', error);
      toast.error('Failed to export customers. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingCustomer(null);
  };

  const canManageCustomers = hasPermission('customers', 'create');
  const isSuperAdmin = user?.role === 'superadmin';

  console.log('Can manage customers:', canManageCustomers);
  console.log('Is superadmin (final):', isSuperAdmin);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Customers</h1>
          <p className="text-dark-600">Manage your customer relationships and contacts</p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Test button - very obvious */}
          <button
            onClick={() => alert('Export button clicked!')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2 transition-colors"
          >
            <span>🚨 TEST EXPORT BUTTON 🚨</span>
          </button>
          
          {/* Temporarily show export button for all users for testing */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : 'Export Excel'}</span>
          </button>
          {canManageCustomers && (
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-600">Total Customers</p>
              <p className="text-2xl font-bold text-dark-900">{customers.length}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {customers.filter(c => c.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-600">This Month</p>
              <p className="text-2xl font-bold text-blue-600">
                {customers.filter(c => {
                  const now = new Date();
                  const customerDate = new Date(c.createdAt);
                  return customerDate.getMonth() === now.getMonth() && customerDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-blue-600" />
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
              placeholder="Search customers..."
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {filteredCustomers.length} of {customers.length} customers
        </p>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dark-900">{customer.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    customer.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {customer.status}
                  </span>
                </div>
              </div>
              
              <div className="relative">
                <button
                  onClick={() => {}}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4 text-dark-600" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {customer.company && (
                <div className="flex items-center text-sm text-dark-600">
                  <Building className="w-4 h-4 mr-2" />
                  <span>{customer.company}</span>
                </div>
              )}
              
              <div className="flex items-center text-sm text-dark-600">
                <Mail className="w-4 h-4 mr-2" />
                <a href={`mailto:${customer.email}`} className="hover:text-primary-600">
                  {customer.email}
                </a>
              </div>
              
              {customer.phone && (
                <div className="flex items-center text-sm text-dark-600">
                  <Phone className="w-4 h-4 mr-2" />
                  <a href={`tel:${customer.phone}`} className="hover:text-primary-600">
                    {customer.phone}
                  </a>
                </div>
              )}
              
              {customer.address && (
                <div className="text-sm text-dark-600">
                  <span className="font-medium">Address:</span>
                  <p className="mt-1 line-clamp-2">{customer.address}</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-xs text-dark-500">
                  Added {customer.createdAt.toLocaleDateString()}
                </div>
                {canManageCustomers && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditCustomer(customer)}
                      className="text-primary-600 hover:text-primary-700 p-1 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer.id)}
                      className="text-red-600 hover:text-red-700 p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-dark-900 mb-2">No customers found</h3>
          <p className="text-dark-600 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by adding your first customer'
            }
          </p>
          {canManageCustomers && !searchTerm && statusFilter === 'all' && (
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Add Customer
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Customer Modal */}
      <CreateCustomerModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateCustomer}
        editCustomer={editingCustomer}
      />
    </div>
  );
}
