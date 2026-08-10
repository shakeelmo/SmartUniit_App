import React, { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Download, CheckCircle2 } from 'lucide-react';
import { useDeliveryNotes } from '../hooks/useDeliveryNotes';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/dateUtils';
import { api } from '../lib/api';
import { generateDeliveryNotePdf } from '../utils/deliveryNotePdf';
import CreateDeliveryNoteModal from '../components/DeliveryNotes/CreateDeliveryNoteModal';
import ViewDeliveryNoteModal from '../components/DeliveryNotes/ViewDeliveryNoteModal';
import EditDeliveryNoteModal from '../components/DeliveryNotes/EditDeliveryNoteModal';

export default function DeliveryNotes() {
  const { deliveryNotes, isLoading, error, deleteDeliveryNote, updateDeliveryNote } = useDeliveryNotes();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);

  const filteredNotes = deliveryNotes.filter(note =>
    note.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.noteNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleView = (note: any) => {
    setSelectedNote(note);
    setShowViewModal(true);
  };

  const handleEdit = (note: any) => {
    setSelectedNote(note);
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this delivery note?')) {
      try {
        await deleteDeliveryNote(id);
      } catch (error) {
        console.error('Error deleting delivery note:', error);
      }
    }
  };

  const handleDownloadPdf = async (note: any) => {
    try {
      const { deliveryNote } = await api.getDeliveryNote(note.id);
      const pdf = await generateDeliveryNotePdf(deliveryNote);
      pdf.save(`${deliveryNote.note_number || 'delivery-note'}.pdf`);
    } catch (error) {
      console.error('Error generating delivery note PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleMarkDelivered = async (note: any) => {
    try {
      await updateDeliveryNote(note.id, { status: 'delivered' });
    } catch (error) {
      console.error('Error marking delivery note as delivered:', error);
      alert('Failed to update status');
    }
  };

  const canCreate = user?.role === 'superadmin' || user?.role === 'admin';
  const canEdit = user?.role === 'superadmin' || user?.role === 'admin';
  const canDelete = user?.role === 'superadmin';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Notes</h1>
          <p className="text-gray-600">Manage delivery notes and track item deliveries</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} />
            Create Delivery Note
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by customer, recipient, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Delivery Notes List */}
      <div className="bg-white rounded-lg shadow">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Download size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No delivery notes found</h3>
            <p className="text-gray-600">Get started by creating your first delivery note.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Note No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNotes.map((note) => (
                  <tr key={note.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-orange-600">
                        {note.noteNumber || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {note.customerName || 'Unknown Customer'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {note.recipientName || 'Not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(note.deliveryDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          note.status === 'delivered'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {note.status === 'delivered' ? 'Delivered' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {note.createdByName || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(note.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {note.status !== 'delivered' && (
                          <button
                            onClick={() => handleMarkDelivered(note)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Mark as Delivered"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadPdf(note)}
                          className="text-purple-600 hover:text-purple-900 p-1"
                          title="Download PDF"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => handleView(note)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleEdit(note)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(note.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateDeliveryNoteModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showViewModal && selectedNote && (
        <ViewDeliveryNoteModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          deliveryNote={selectedNote}
        />
      )}

      {showEditModal && selectedNote && (
        <EditDeliveryNoteModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          deliveryNote={selectedNote}
        />
      )}
    </div>
  );
} 
