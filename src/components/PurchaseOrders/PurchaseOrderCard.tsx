import React from 'react';
import { Calendar, Download, Edit, FileText, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PurchaseOrder } from '../../types/purchaseOrder';
import { formatCurrency } from '../../utils/format';
import { generatePurchaseOrderPDF } from '../../utils/purchaseOrderPdf';

interface PurchaseOrderCardProps {
  purchaseOrder: PurchaseOrder;
  onEdit: (purchaseOrder: PurchaseOrder) => void;
  onDelete: (id: string) => Promise<void>;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  issued: 'bg-blue-100 text-blue-800',
  received: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  fulfilled: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function PurchaseOrderCard({ purchaseOrder, onEdit, onDelete }: PurchaseOrderCardProps) {
  const [isExporting, setIsExporting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const counterpartyName = purchaseOrder.direction === 'received'
    ? purchaseOrder.customer?.company || purchaseOrder.customer?.name || 'Customer'
    : purchaseOrder.vendor?.name || 'Vendor';

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await generatePurchaseOrderPDF(purchaseOrder);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `purchase-order-${purchaseOrder.poNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Purchase order PDF download started');
    } catch (error) {
      console.error('Error exporting purchase order PDF:', error);
      toast.error('Error generating purchase order PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this purchase order?')) return;
    try {
      setIsDeleting(true);
      await onDelete(purchaseOrder.id);
      toast.success('Purchase order deleted');
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      toast.error('Failed to delete purchase order');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-dark-900">{purchaseOrder.poNumber}</h3>
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[purchaseOrder.status] || statusColors.draft}`}>
              {purchaseOrder.status}
            </span>
          </div>
          <p className="text-sm text-dark-700">{counterpartyName}</p>
          <p className="text-xs uppercase tracking-wide text-dark-500">
            {purchaseOrder.direction === 'received' ? 'Received PO' : 'Issued PO'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-primary-600">SAR {formatCurrency(purchaseOrder.total, 'SAR')}</p>
          <p className="text-xs text-dark-500">VAT: SAR {formatCurrency(purchaseOrder.vatAmount, 'SAR')}</p>
        </div>
      </div>

      <div className="space-y-2 text-sm text-dark-600">
        <div className="flex items-center">
          <Calendar className="mr-2 h-4 w-4" />
          <span>{purchaseOrder.poDate.toLocaleDateString()}</span>
        </div>
        <div className="flex items-center">
          <FileText className="mr-2 h-4 w-4" />
          <span>{purchaseOrder.lineItems.length} line items</span>
        </div>
        {purchaseOrder.referenceNumber && <p>Reference: {purchaseOrder.referenceNumber}</p>}
      </div>

      <div className="mt-5 flex items-center justify-end space-x-2">
        <button onClick={() => onEdit(purchaseOrder)} className="rounded-lg p-2 text-dark-600 hover:bg-gray-100" title="Edit">
          <Edit className="h-4 w-4" />
        </button>
        <button onClick={handleExport} disabled={isExporting} className="rounded-lg p-2 text-primary-600 hover:bg-primary-50" title="Export PDF">
          <Download className="h-4 w-4" />
        </button>
        <button onClick={handleDelete} disabled={isDeleting} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Delete">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
