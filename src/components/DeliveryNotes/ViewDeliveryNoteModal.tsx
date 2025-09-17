import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { X, Download } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

interface ViewDeliveryNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryNote: any;
}

export default function ViewDeliveryNoteModal({ isOpen, onClose, deliveryNote }: ViewDeliveryNoteModalProps) {
  if (!isOpen || !deliveryNote) return null;

  const handleExportPDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    // Header
    doc.setFontSize(16);
    doc.text('Delivery Note', 14, 15);

    // Meta details
    doc.setFontSize(11);
    const metaLines = [
      `Customer: ${deliveryNote.customerName || 'Unknown'}`,
      `Recipient: ${deliveryNote.recipientName || 'Not specified'}`,
      `Delivery Date: ${formatDate(deliveryNote.deliveryDate)}`,
      `Created By: ${deliveryNote.createdByName || 'Unknown'}`,
      `Created At: ${formatDate(deliveryNote.createdAt)}`
    ];
    metaLines.forEach((line: string, idx: number) => {
      doc.text(line, 14, 24 + idx * 6);
    });

    // Notes block
    const notes = deliveryNote.notes || '';
    if (notes) {
      doc.setFontSize(12);
      doc.text('Notes:', 14, 56);
      doc.setFontSize(11);
      const split = doc.splitTextToSize(notes, 180);
      doc.text(split, 14, 62);
    }

    // Items table
    const tableStartY = notes ? 62 + (doc.getTextDimensions(notes).h || 6) + 6 : 62;
    autoTable(doc, {
      startY: tableStartY,
      head: [['Description', 'Quantity', 'Unit', 'Remarks']],
      body: (deliveryNote.items || []).map((item: any) => [
        item.description || '',
        String(item.quantity ?? ''),
        item.unit || '',
        item.remarks || ''
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [243, 244, 246], textColor: 0 },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { halign: 'right', cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 50 }
      }
    });

    // Signature image if present
    if (deliveryNote.signature) {
      let y = (doc as any).lastAutoTable?.finalY || tableStartY + 10;
      y += 10;
      doc.setFontSize(12);
      doc.text('Recipient Signature:', 14, y);
      try {
        doc.addImage(deliveryNote.signature, 'PNG', 14, y + 4, 50, 20);
      } catch {
        // Ignore image errors silently
      }
    }

    const fileName = `Delivery_Note_${deliveryNote.id || ''}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Delivery Note Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer</label>
                  <p className="text-sm text-gray-900">{deliveryNote.customerName || 'Unknown Customer'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Recipient</label>
                  <p className="text-sm text-gray-900">{deliveryNote.recipientName || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Delivery Date</label>
                  <p className="text-sm text-gray-900">{formatDate(deliveryNote.deliveryDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created By</label>
                  <p className="text-sm text-gray-900">{deliveryNote.createdByName || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created Date</label>
                  <p className="text-sm text-gray-900">{formatDate(deliveryNote.createdAt)}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-900">
                  {deliveryNote.notes || 'No additional notes provided.'}
                </p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delivered Items</h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deliveryNote.items?.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.remarks || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signature */}
          {deliveryNote.signature && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recipient Signature</h3>
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <img
                  src={deliveryNote.signature}
                  alt="Recipient Signature"
                  className="max-w-full h-auto"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
            >
              <Download size={16} />
              Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 