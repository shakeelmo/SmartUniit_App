import React, { useState } from 'react';
import { FileBadge2, Filter, Plus, Search, ShoppingBag, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { CreatePurchaseOrderModal } from '../components/PurchaseOrders/CreatePurchaseOrderModal';
import { PurchaseOrderCard } from '../components/PurchaseOrders/PurchaseOrderCard';
import { useCustomers } from '../hooks/useCustomers';
import { usePurchaseOrders } from '../hooks/usePurchaseOrders';
import { useVendors } from '../hooks/useVendors';
import { PurchaseOrder } from '../types/purchaseOrder';

export function PurchaseOrders() {
  const { purchaseOrders, isLoading, addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder } = usePurchaseOrders();
  const { vendors, isLoading: vendorsLoading } = useVendors();
  const { customers, isLoading: customersLoading } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchaseOrder, setEditingPurchaseOrder] = useState<PurchaseOrder | null>(null);

  const filteredPurchaseOrders = purchaseOrders.filter((purchaseOrder) => {
    const partyName = purchaseOrder.direction === 'received'
      ? purchaseOrder.customer?.company || purchaseOrder.customer?.name || ''
      : purchaseOrder.vendor?.name || '';
    const matchesSearch =
      purchaseOrder.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (purchaseOrder.referenceNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || purchaseOrder.status === statusFilter;
    const matchesDirection = directionFilter === 'all' || purchaseOrder.direction === directionFilter;
    return matchesSearch && matchesStatus && matchesDirection;
  });

  const stats = {
    total: purchaseOrders.length,
    issued: purchaseOrders.filter((po) => po.direction === 'issued').length,
    received: purchaseOrders.filter((po) => po.direction === 'received').length,
    value: purchaseOrders.reduce((sum, po) => sum + po.total, 0),
  };

  const handleSubmit = async (payload: any) => {
    try {
      if (editingPurchaseOrder) {
        await updatePurchaseOrder(editingPurchaseOrder.id, payload);
        toast.success('Purchase order updated successfully');
      } else {
        await addPurchaseOrder(payload);
        toast.success('Purchase order created successfully');
      }
      setEditingPurchaseOrder(null);
      setIsModalOpen(false);
      return true;
    } catch (error) {
      console.error('Error saving purchase order:', error);
      toast.error('Failed to save purchase order');
      return false;
    }
  };

  const openCreate = () => {
    setEditingPurchaseOrder(null);
    setIsModalOpen(true);
  };

  const openEdit = (purchaseOrder: PurchaseOrder) => {
    setEditingPurchaseOrder(purchaseOrder);
    setIsModalOpen(true);
  };

  if (isLoading || vendorsLoading || customersLoading) {
    return <div className="p-6 text-dark-600">Loading purchase orders...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Purchase Orders</h1>
          <p className="text-dark-600">Issue vendor POs and track purchase orders received from customers.</p>
        </div>
        <button onClick={openCreate} className="flex items-center space-x-2 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
          <Plus className="h-4 w-4" />
          <span>New PO</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-600">Total POs</p>
              <p className="text-2xl font-bold text-dark-900">{stats.total}</p>
            </div>
            <div className="rounded-lg bg-primary-100 p-2">
              <FileBadge2 className="h-5 w-5 text-primary-600" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-600">Issued</p>
              <p className="text-2xl font-bold text-blue-600">{stats.issued}</p>
            </div>
            <div className="rounded-lg bg-blue-100 p-2">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-600">Received</p>
              <p className="text-2xl font-bold text-amber-600">{stats.received}</p>
            </div>
            <div className="rounded-lg bg-amber-100 p-2">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-600">Total Value</p>
              <p className="text-xl font-bold text-primary-600">SAR {stats.value.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-primary-100 p-2">
              <ShoppingBag className="h-5 w-5 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by PO number, party, reference..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-transparent focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center space-x-3">
            <Filter className="h-4 w-4 text-dark-600" />
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="all">All Directions</option>
              <option value="issued">Issued</option>
              <option value="received">Received</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="issued">Issued</option>
              <option value="received">Received</option>
              <option value="approved">Approved</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredPurchaseOrders.map((purchaseOrder) => (
          <PurchaseOrderCard
            key={purchaseOrder.id}
            purchaseOrder={purchaseOrder}
            onEdit={openEdit}
            onDelete={deletePurchaseOrder}
          />
        ))}
      </div>

      {filteredPurchaseOrders.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <FileBadge2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-dark-900">No purchase orders yet</h3>
          <p className="mt-2 text-dark-600">Create the first PO and we’ll keep vendor and customer flows in one place.</p>
        </div>
      )}

      <CreatePurchaseOrderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPurchaseOrder(null);
        }}
        onSubmit={handleSubmit}
        vendors={vendors}
        customers={customers}
        editPurchaseOrder={editingPurchaseOrder}
      />
    </div>
  );
}
